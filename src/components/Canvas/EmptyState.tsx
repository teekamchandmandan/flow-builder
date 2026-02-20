import { Plus } from 'lucide-react';

export function EmptyState() {
  return (
    <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
      <div className='flex flex-col items-center gap-2 text-muted-foreground'>
        <Plus className='h-8 w-8 opacity-40' />
        <p className='text-sm'>Add your first node with the + button above</p>
      </div>
    </div>
  );
}
