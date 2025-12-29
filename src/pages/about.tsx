import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Brain, Database, Satellite, Code2, Orbit, Calculator } from "lucide-react"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black pt-20 px-4 pb-20">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <Badge variant="outline" className="font-mono text-mission-orange border-mission-orange">PROJECT: ODIN</Badge>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white">Mission Overview</h1>
                    <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
                        A precision trajectory planning system for cislunar operations, combining classical orbital mechanics with modern web technologies.
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* Section 1: Core Goal */}
                    <Card className="glass-panel border-white/10 bg-black/20">
                        <CardHeader>
                            <CardTitle className="text-2xl font-display text-white">The Mission Objective</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-gray-300 leading-relaxed">
                            <p>
                                The <strong className="text-white">Optimal Dynamic Interplanetary Navigator (ODIN)</strong> is a web-based trajectory planning tool designed for Earth-Moon transfer missions.
                                It solves Lambert's Problem to calculate optimal orbital transfer trajectories between any two points in cislunar space.
                            </p>
                            <p>
                                Unlike traditional mission planning software, ODIN provides an interactive 3D visualization of trajectory solutions, real-time delta-V calculations,
                                and integrates live space weather data from NASA to assess mission risks. The system is designed to be accessible, educational, and scientifically accurate.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Section 2: Technical Stack */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="glass-panel border-white/10 bg-black/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-space-blue font-display">
                                    <Orbit className="w-5 h-5" />
                                    Orbital Mechanics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-gray-400 font-mono">
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">01.</span>
                                        <span><strong>Lambert Solver:</strong> Solves the two-point boundary value problem for conic orbital transfers.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">02.</span>
                                        <span><strong>Delta-V Calculator:</strong> Computes fuel requirements based on Tsiolkovsky rocket equation.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">03.</span>
                                        <span><strong>Orbital Elements:</strong> Displays semi-major axis, eccentricity, inclination, and other Keplerian parameters.</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="glass-panel border-white/10 bg-black/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-space-blue font-display">
                                    <Database className="w-5 h-5" />
                                    Data Integration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-gray-400 font-mono">
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">01.</span>
                                        <span><strong>NASA DONKI API:</strong> Real-time space weather notifications including solar flares and CMEs.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">02.</span>
                                        <span><strong>Vercel Edge Functions:</strong> Serverless API endpoints for low-latency data fetching.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">03.</span>
                                        <span><strong>PostgreSQL (Neon):</strong> Optional persistent storage for mission presets and trajectory history.</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 3: Technology Stack */}
                    <Card className="glass-panel border-white/10 bg-black/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-white font-display">
                                <Code2 className="w-5 h-5" />
                                Technology Stack
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-gray-300">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-white font-semibold mb-2">Frontend</h4>
                                    <ul className="space-y-1 text-sm font-mono text-gray-400">
                                        <li>• React + TypeScript</li>
                                        <li>• Three.js for 3D visualization</li>
                                        <li>• TailwindCSS for styling</li>
                                        <li>• Wouter for routing</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-2">Backend</h4>
                                    <ul className="space-y-1 text-sm font-mono text-gray-400">
                                        <li>• Vercel Serverless Functions</li>
                                        <li>• Drizzle ORM</li>
                                        <li>• NASA DONKI API integration</li>
                                        <li>• PostgreSQL (Neon)</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 4: Features */}
                    <Card className="glass-panel border-white/10 bg-black/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-white font-display">
                                <Calculator className="w-5 h-5" />
                                Key Features
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-gray-300">
                            <ul className="grid md:grid-cols-2 gap-3 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-mission-orange">→</span>
                                    <span>Interactive 3D trajectory visualization</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-mission-orange">→</span>
                                    <span>Real-time delta-V and fuel cost calculations</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-mission-orange">→</span>
                                    <span>Mission presets for common trajectories</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-mission-orange">→</span>
                                    <span>Space weather threat assessment</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-mission-orange">→</span>
                                    <span>Export trajectory data (JSON/CSV)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-mission-orange">→</span>
                                    <span>Dark/Light mode support</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
