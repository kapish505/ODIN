import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type User } from "./schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "odin_mission_control_secret",
        resave: false,
        saveUninitialized: false,
        store: undefined, // Default MemoryStore for now
        cookie: {
            secure: process.env.NODE_ENV === "production",
        }
    };

    if (app.get("env") === "production") {
        app.set("trust proxy", 1); // trust first proxy
    }

    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
                if (!user) return done(null, false, { message: "Invalid username" });

                // For MVP, if we want to allow auto-login or simple demo, we could skip hash check for 'admin'
                // But let's do it right. If user exists, check password.
                const isValid = await comparePasswords(password, user.password);
                if (!isValid) return done(null, false, { message: "Invalid password" });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, (user as User).id);
    });

    passport.deserializeUser(async (id: number, done) => {
        try {
            const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });

    app.post("/api/register", async (req, res, next) => {
        try {
            const result = insertUserSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).send(result.error.issues);
            }

            const { username, password } = result.data;
            const [existingUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);

            if (existingUser) {
                return res.status(400).send("Username already exists");
            }

            const hashedPassword = await hashPassword(password);
            const [newUser] = await db.insert(users).values({ username, password: hashedPassword }).returning();

            req.login(newUser, (err) => {
                if (err) return next(err);
                res.status(201).json({ message: "User created", user: { id: newUser.id, username: newUser.username } });
            });
        } catch (err) {
            next(err);
        }
    });

    app.post("/api/login", passport.authenticate("local"), (req, res) => {
        res.status(200).json({ message: "Logged in successfully", user: req.user });
    });

    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.sendStatus(200);
        });
    });

    app.get("/api/user", (req, res) => {
        if (req.isAuthenticated()) {
            return res.json(req.user);
        }
        res.status(401).send("Not authenticated");
    });
}
