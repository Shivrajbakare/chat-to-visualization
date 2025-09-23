// components/Visualization.js
export default function Visualization({ layers }) {
  return (
    <svg width={600} height={400}>
      {layers.map((layer) => {
        if (layer.type === "circle") {
          return (
            <circle
              key={layer.id}
              cx={layer.props.x}
              cy={layer.props.y}
              r={layer.props.r}
              fill={layer.props.fill}
            />
          );
        }
        if (layer.type === "arrow") {
          return (
            <line
              key={layer.id}
              x1={layer.props.x}
              y1={layer.props.y}
              x2={layer.props.x + layer.props.dx}
              y2={layer.props.y + layer.props.dy}
              stroke={layer.props.stroke}
              strokeWidth={3}
            />
          );
        }
        if (layer.type === "text") {
          return (
            <text
              key={layer.id}
              x={layer.props.x}
              y={layer.props.y}
              fill={layer.props.fill}
            >
              {layer.props.text}
            </text>
          );
        }
      })}
    </svg>
  );
}
