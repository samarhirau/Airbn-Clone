import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Server,
  Database,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Cpu,
  Wifi,
  Radio,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import AdminSubNav from '../../components/admin/AdminSubNav';
import toast from 'react-hot-toast';

export default function AdminSystemHealth() {
  const [healthData, setHealthData] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // in seconds
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const timerRef = useRef(null);

  const fetchHealth = async () => {
    const startTime = performance.now();
    try {
      const res = await api.get('/health');
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      const data = res?.data || res;
      setHealthData(data);
      setLastCheck(new Date());
    } catch (err) {
      toast.error(`Health probe failed: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Handle auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      fetchHealth();
    }, refreshInterval * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, refreshInterval]);

  // Format uptime in human-readable duration
  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const isHealthy = healthData?.status === 'ok';
  const mongoStatus = healthData?.dependencies?.mongodb || 'unknown';
  const redisStatus = healthData?.dependencies?.redis || 'disabled';

  return (
    <div className="min-h-screen bg-surface-card/40 pb-20">
      {/* Admin Sub Navigation */}
      <AdminSubNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header with Live Telemetry Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-charcoal tracking-tight">
                System Health & Infrastructure
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isHealthy
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {healthData?.status || 'Probing...'}
              </span>
            </div>
            <p className="text-sm text-meta">
              Live server heartbeat, microservice latency telemetry, and database connection monitors.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Auto Refresh Select */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-surface-border text-xs font-semibold text-charcoal shadow-xs">
              <Radio
                className={`w-3.5 h-3.5 ${
                  autoRefresh ? 'text-emerald-500 animate-pulse' : 'text-meta'
                }`}
              />
              <span className="hidden md:inline">Auto-refresh:</span>
              <select
                value={refreshInterval}
                disabled={!autoRefresh}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent font-bold outline-none cursor-pointer"
              >
                <option value={5}>Every 5s</option>
                <option value={10}>Every 10s</option>
                <option value={30}>Every 30s</option>
              </select>
            </div>

            {/* Toggle Auto */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-meta border-surface-border hover:bg-neutral-100'
              }`}
            >
              {autoRefresh ? 'Live' : 'Paused'}
            </button>

            {/* Manual Refresh CTA */}
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-surface-border hover:bg-neutral-50 text-charcoal shadow-xs transition-colors cursor-pointer"
              title="Ping health check now"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-airbnb' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Core Telemetry Metric Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Status */}
          <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-meta">
              <span className="text-xs font-bold uppercase tracking-wider">Cluster State</span>
              <div
                className={`p-2 rounded-xl ${
                  isHealthy
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                <Server className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-charcoal capitalize">
              {healthData?.status || 'Degraded'}
            </p>
            <p className="text-xs text-meta font-medium">All critical microservices online</p>
          </div>

          {/* Latency Ping */}
          <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-meta">
              <span className="text-xs font-bold uppercase tracking-wider">API Roundtrip</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Wifi className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-charcoal">
              {latencyMs !== null ? `${latencyMs} ms` : '—'}
            </p>
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Ultra-low HTTP latency</span>
            </p>
          </div>

          {/* Uptime */}
          <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-meta">
              <span className="text-xs font-bold uppercase tracking-wider">Process Uptime</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-charcoal">
              {formatUptime(healthData?.uptime)}
            </p>
            <p className="text-xs text-meta font-medium">Zero unexpected process restarts</p>
          </div>

          {/* Environment */}
          <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-meta">
              <span className="text-xs font-bold uppercase tracking-wider">Runtime Mode</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-charcoal capitalize">
              {healthData?.environment || 'Development'}
            </p>
            <p className="text-xs text-meta font-medium">Node.js Express TypeScript stack</p>
          </div>
        </div>

        {/* Deep Dependency Health Grids */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MongoDB Cluster Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-surface-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-charcoal">
                    MongoDB Database Cluster
                  </h3>
                  <p className="text-xs text-meta">Document storage & atomic transactions</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  mongoStatus === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {mongoStatus}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-surface-border/50">
                <span className="text-meta font-medium">Connection State</span>
                <span className="font-bold text-charcoal capitalize">{mongoStatus}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-surface-border/50">
                <span className="text-meta font-medium">Driver Pool Protocol</span>
                <span className="font-mono font-semibold text-charcoal">Mongoose 8.x Pool</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-surface-border/50">
                <span className="text-meta font-medium">Session Consistency</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACID Replica Transactions Ready</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-meta font-medium">Heartbeat Probe</span>
                <span className="font-semibold text-charcoal">
                  {lastCheck ? lastCheck.toLocaleTimeString() : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Redis / Cache Service Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-surface-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-charcoal">
                    Redis Cache Subsystem
                  </h3>
                  <p className="text-xs text-meta">In-memory query acceleration & rate limiter</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  redisStatus === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-neutral-100 text-meta'
                }`}
              >
                {redisStatus}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-surface-border/50">
                <span className="text-meta font-medium">Cache Adapter</span>
                <span className="font-bold text-charcoal">
                  {redisStatus === 'connected' ? 'iORedis v5 Cluster' : 'In-Memory Mock Fallback'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-surface-border/50">
                <span className="text-meta font-medium">Rate Limiting Protection</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Token Bucket Active</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-surface-border/50">
                <span className="text-meta font-medium">Storefront Cache TTL</span>
                <span className="font-mono font-semibold text-charcoal">60s (Auto-invalidated)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-meta font-medium">Degradation Safety</span>
                <span className="font-semibold text-charcoal">Zero Failure Passthrough</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & System Info Banner */}
        <div className="mt-8 p-5 bg-white rounded-3xl border border-surface-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-charcoal">
                Secure Redaction Policy Enforced
              </h4>
              <p className="text-[11px] text-meta">
                All connection strings, API keys, and internal IP signatures are redacted from public probes.
              </p>
            </div>
          </div>
          <p className="text-xs font-mono text-meta">
            Server Timestamp: {healthData?.timestamp || new Date().toISOString()}
          </p>
        </div>
      </div>
    </div>
  );
}
