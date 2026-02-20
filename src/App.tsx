import { ReactFlowProvider } from '@xyflow/react';

import { FlowCanvas } from '@/components/Canvas/FlowCanvas';

function App() {
  return (
    <ReactFlowProvider>
      <div className='flex h-screen w-screen flex-col bg-background text-foreground'>
        <div className='flex-1'>
          <FlowCanvas />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
