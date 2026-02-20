import { ReactFlowProvider } from '@xyflow/react';

import { FlowCanvas } from '@/components/Canvas/FlowCanvas';
import { NodeSidebar } from '@/components/Sidebar/NodeSidebar';

function App() {
  return (
    <ReactFlowProvider>
      <div className='flex h-screen w-screen flex-col bg-background text-foreground'>
        <div className='flex-1'>
          <FlowCanvas />
        </div>
        <NodeSidebar />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
