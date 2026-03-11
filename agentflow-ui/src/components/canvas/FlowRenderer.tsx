import { useFlowStore } from '../../store/flowStore';
import ProcessorNode3D from '../nodes/ProcessorNode3D';
import ProcessGroupNode3D from '../nodes/ProcessGroupNode3D';
import Connection3D from '../connections/Connection3D';

export default function FlowRenderer() {
  const nodes = useFlowStore((s) => s.nodes);
  const connections = useFlowStore((s) => s.connections);
  const groups = useFlowStore((s) => s.groups);

  return (
    <group>
      {/* Connections render first so they appear behind node cards */}
      {Object.values(connections).map((conn) => (
        <Connection3D key={conn.id} connection={conn} />
      ))}
      {Object.values(nodes).map((node) => (
        <ProcessorNode3D key={node.id} node={node} />
      ))}
      {Object.values(groups)
        .filter((g) => g.isExpanded)
        .map((group) => (
          <ProcessGroupNode3D key={group.id} group={group} />
        ))}
    </group>
  );
}
