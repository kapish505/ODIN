import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Brain, Database, Satellite, Code2 } from "lucide-react"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black pt-20 px-4 pb-20">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <Badge variant="outline" className="font-mono text-mission-orange border-mission-orange">PROJECT: ODIN</Badge>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white">Technical Architecture</h1>
                    <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
                        An exploration into autonomous cislunar navigation systems using modern web technologies and orbital mechanics.
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
                                The <strong className="text-white">Optimal Dynamic Interplanetary Navigator (ODIN)</strong> is designed to solve the complex problem of real-time spacecraft trajectory optimization in a dynamic, high-threat environment.
                                Unlike traditional mission planning which happens months in advance, ODIN simulates an autonomous flight computer capable of replanning mid-flight.
                            </p>
                            <p>
                                This system bridges the gap between rigorous orbital mechanics (Lambert's Problem) and modern user interface design, providing a "Glass Box" view into the decision-making process of an autonomous probe.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Section 2: Technical Stack */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="glass-panel border-white/10 bg-black/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-space-blue font-display">
                                    <Brain className="w-5 h-5" />
                                    Algorithmic Core
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-gray-400 font-mono">
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">01.</span>
                                        <span><strong>Lambert Solver:</strong> Solves the boundary value problem for transfer orbits between Earth and Moon.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">02.</span>
                                        <span><strong>Physics Engine:</strong> Simulates Delta-V requirements and orbital periods based on gravitational parameters (μ).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">03.</span>
                                        <span><strong>Risk Assessment:</strong> Probabilistic evaluation of Solar Particle Events (SPEs) and Galactic Cosmic Rays (GCRs).</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="glass-panel border-white/10 bg-black/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-space-blue font-display">
                                    <Database className="w-5 h-5" />
                                    Data Ingestion
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-gray-400 font-mono">
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">01.</span>
                                        <span><strong>NASA DONKI API:</strong> Direct telemetry from the Database of Notifications, Knowledge, Information (DONKI).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">02.</span>
                                        <span><strong>Serverless Proxy:</strong> Optimized Vercel Edge Functions for secure, low-latency data fetching.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-mission-orange">03.</span>
                                        <span><strong>PostgreSQL:</strong> Persistent storage for mission logs and decisions (Neon DB).</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>


                </div>
            </div>
        </div>
    )
}
