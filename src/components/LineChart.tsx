import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { DayPoint } from '../db/queries';

interface Props {
  data: DayPoint[];
  width: number;
  color?: string;
}

const HEIGHT = 200;
const PAD = { top: 20, right: 16, bottom: 28, left: 36 };

// 极简折线图：纯 SVG 自绘，不依赖重型图表库。
export default function LineChart({ data, width, color = '#3b82f6' }: Props) {
  if (data.length === 0) {
    return <Text style={styles.empty}>这个范围还没有数据</Text>;
  }

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const values = data.map((d) => d.total);
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const span = maxV - minV || 1;

  const x = (i: number) =>
    PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - ((v - minV) / span) * plotH;

  const points = data.map((d, i) => `${x(i)},${y(d.total)}`).join(' ');

  return (
    <Svg width={width} height={HEIGHT}>
      {/* 横向网格线 + Y 轴刻度 */}
      {[0, 0.5, 1].map((t) => {
        const v = minV + span * t;
        const yy = y(v);
        return (
          <React.Fragment key={t}>
            <Line x1={PAD.left} y1={yy} x2={width - PAD.right} y2={yy} stroke="#eee" strokeWidth={1} />
            <SvgText x={PAD.left - 6} y={yy + 4} fontSize={10} fill="#999" textAnchor="end">
              {Math.round(v)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* 折线 */}
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} />

      {/* 数据点 + X 轴日期（首/中/尾） */}
      {data.map((d, i) => {
        const showLabel = i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2);
        return (
          <React.Fragment key={d.day}>
            <Circle cx={x(i)} cy={y(d.total)} r={3} fill={color} />
            {showLabel && (
              <SvgText
                x={x(i)}
                y={HEIGHT - 8}
                fontSize={10}
                fill="#999"
                textAnchor="middle"
              >
                {d.day.slice(5)}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', color: '#999', paddingVertical: 60, fontSize: 15 },
});
