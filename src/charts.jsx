import React from 'react';
import { fmtINR } from './ui';

const useMeasure = () => {
  const ref = React.useRef(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    setSize({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
};

const LineChart = ({ data, height = 140, accent = 'var(--ink-1)', xKey = 'm', yKey = 'v', showAxis = true, fill = true }) => {
  if (!data || data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 12 }}>No data</div>;

  const [ref, { w }] = useMeasure();
  const padL = 36, padR = 12, padT = 12, padB = showAxis ? 22 : 8;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;
  const ys = data.map(d => d[yKey]).filter(Boolean);
  let minY = 0, maxY = 1, range = 1;
  if (ys.length > 0) {
    minY = Math.min(...ys, 0);
    maxY = Math.max(...ys);
    range = maxY - minY || 1;
  }
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padL + i * stepX,
    y: padT + innerH - ((d[yKey] || 0 - minY) / range) * innerH,
  }));
  const path = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const area = path + ` L${padL + innerW},${padT + innerH} L${padL},${padT + innerH} Z`;
  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => minY + (range * i / yTicks));

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {w > 0 && (
        <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`grad-${accent.replace(/[^a-z0-9]/gi, '')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.10"/>
              <stop offset="100%" stopColor={accent} stopOpacity="0"/>
            </linearGradient>
          </defs>
          {ticks.map((t, i) => {
            const y = padT + innerH - ((t - minY) / range) * innerH;
            return (
              <g key={i}>
                <line x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="var(--border-subtle)" strokeDasharray={i === 0 ? '0' : '2 3'}/>
                <text x={padL - 8} y={y + 3} fontSize="10" textAnchor="end" fill="var(--ink-4)" fontFamily="var(--font-mono)">
                  {t >= 10000000 ? (t/10000000).toFixed(1).replace(/\.?0+$/,'')+'Cr' : t >= 100000 ? (t/100000).toFixed(1).replace(/\.?0+$/,'')+'L' : t >= 1000 ? (t/1000).toFixed(0)+'k' : Math.round(t)}
                </text>
              </g>
            );
          })}
          {fill && <path d={area} fill={`url(#grad-${accent.replace(/[^a-z0-9]/gi, '')})`}/>}
          <path d={path} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--bg-elevated)" stroke={accent} strokeWidth="1.5"/>
          ))}
          {showAxis && data.map((d, i) => (
            <text key={i} x={padL + i * stepX} y={height - 6} fontSize="10" textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--font-mono)">
              {d[xKey]}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
};

const BarChart = ({ data, height = 140, accent = 'var(--ink-1)', xKey = 'd', yKey = 'v', showAxis = true }) => {
  const [ref, { w }] = useMeasure();
  const padL = 28, padR = 8, padT = 12, padB = showAxis ? 22 : 8;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;
  const ys = data.map(d => d[yKey]);
  const maxY = Math.max(...ys, 1);
  const slot = data.length > 0 ? innerW / data.length : 0;
  const barW = Math.max(8, slot * 0.55);
  const yTicks = 3;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => (maxY * i / yTicks));

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {w > 0 && (
        <svg width={w} height={height} style={{ display: 'block' }}>
          {ticks.map((t, i) => {
            const y = padT + innerH - (t / maxY) * innerH;
            return (
              <g key={i}>
                <line x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="var(--border-subtle)" strokeDasharray={i === 0 ? '0' : '2 3'}/>
                <text x={padL - 6} y={y + 3} fontSize="10" textAnchor="end" fill="var(--ink-4)" fontFamily="var(--font-mono)">
                  {t >= 10000000 ? (t/10000000).toFixed(1).replace(/\.?0+$/,'')+'Cr' : t >= 100000 ? (t/100000).toFixed(1).replace(/\.?0+$/,'')+'L' : t >= 1000 ? (t/1000).toFixed(0)+'k' : Math.round(t)}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const h = (d[yKey] / maxY) * innerH;
            const x = padL + i * slot + (slot - barW) / 2;
            const y = padT + innerH - h;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={h} rx="2" fill={accent} opacity={d.highlight ? 1 : 0.85}/>
                {showAxis && (
                  <text x={x + barW / 2} y={height - 6} fontSize="10" textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--font-mono)">{d[xKey]}</text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

const DonutChart = ({ data, size = 180, thickness = 22 }) => {
  if (!data || data.length === 0) return <div style={{ height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 12, textAlign: 'center' }}>No spending data</div>;

  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0) return <div style={{ height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 12 }}>No spending data</div>;

  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  let acc = 0;
  const segs = data.map(d => {
    const startA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value || 0;
    const endA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = (endA - startA) > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(startA);
    const y1 = cy + r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA);
    const y2 = cy + r * Math.sin(endA);
    return {
      d: `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`,
      color: d.color,
      label: d.label,
      value: d.value || 0,
    };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth={thickness}/>
          {segs.map((s, i) => (
            <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={thickness} strokeLinecap="butt"/>
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="eyebrow" style={{ fontSize: 10 }}>Total</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(total)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 160 }}>
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round(((d.value || 0) / total) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }}/>
              <span style={{ flex: 1, color: 'var(--ink-2)' }}>{d.label}</span>
              <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{pct}%</span>
              <span style={{ color: 'var(--ink-1)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', minWidth: 60, textAlign: 'right' }}>{fmtINR(d.value || 0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HeatmapChart = ({ data, accent = 'var(--ink-1)', accentHex = '#1c1917' }) => {
  const [hovered, setHovered] = React.useState(null);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p'];
  const cellW = 28, cellH = 18, gap = 3;
  const padL = 30, padT = 0, padB = 22;
  const gridW = hours.length * (cellW + gap) - gap;
  const gridH = days.length * (cellH + gap) - gap;
  const svgW = padL + gridW;
  const svgH = padT + gridH + padB;

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  const { r, g, b } = hexToRgb(accentHex.startsWith('#') ? accentHex : '#1c1917');

  return (
    <div style={{ position: 'relative' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block', overflow: 'visible' }}>
        {days.map((d, di) => (
          <text key={di} x={padL - 6} y={padT + di * (cellH + gap) + cellH / 2 + 4} fontSize={9} textAnchor="end" fill="var(--ink-4)" fontFamily="var(--font-mono)">{d}</text>
        ))}
        {hours.map((h, hi) => (
          <text key={hi} x={padL + hi * (cellW + gap) + cellW / 2} y={svgH - 6} fontSize={9} textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--font-mono)">{h}</text>
        ))}
        {data.map((row, di) =>
          row.map((val, hi) => {
            const x = padL + hi * (cellW + gap);
            const y = padT + di * (cellH + gap);
            const alpha = val / 100;
            const fill = `rgba(${r},${g},${b},${(alpha * 0.85 + 0.04).toFixed(2)})`;
            const isHov = hovered && hovered[0] === di && hovered[1] === hi;
            return (
              <rect
                key={`${di}-${hi}`}
                x={x} y={y} width={cellW} height={cellH} rx={3}
                fill={fill}
                stroke={isHov ? accent : 'transparent'} strokeWidth={1.5}
                style={{ cursor: 'default', transition: 'stroke 80ms' }}
                onMouseEnter={() => setHovered([di, hi])}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })
        )}
      </svg>
      {hovered && (() => {
        const [di, hi] = hovered;
        const val = data[di][hi];
        const x = padL + hi * (cellW + gap) + cellW / 2;
        const y = padT + di * (cellH + gap);
        return (
          <div style={{
            position: 'absolute',
            left: x, top: y - 28,
            transform: 'translateX(-50%)',
            background: 'var(--ink-1)', color: 'white',
            fontSize: 10, fontFamily: 'var(--font-mono)',
            padding: '3px 7px', borderRadius: 4,
            pointerEvents: 'none', whiteSpace: 'nowrap',
            zIndex: 10,
          }}>
            {days[di]} {hours[hi]} · {val}%
          </div>
        );
      })()}
    </div>
  );
};

export { LineChart, BarChart, DonutChart, HeatmapChart };
