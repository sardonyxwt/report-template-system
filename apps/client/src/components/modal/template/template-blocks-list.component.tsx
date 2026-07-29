import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { type UseFieldArrayReturn, type UseFormReturn } from 'react-hook-form';
import { TemplateBlockCard } from './template-block-card.component';
import { type TemplateForm } from './template.types';

export const TemplateBlocksList = ({
  form,
  blocks,
}: {
  form: UseFormReturn<TemplateForm>;
  blocks: UseFieldArrayReturn<TemplateForm, 'data.blocks'>;
}) => {
  const [isSorting, setIsSorting] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (_event: DragStartEvent) => {
    setIsSorting(true);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setIsSorting(false);

    if (!over || active.id === over.id) {
      return;
    }

    const from = blocks.fields.findIndex(({ type }) => type === active.id);
    const to = blocks.fields.findIndex(({ type }) => type === over.id);

    if (from < 0 || to < 0) {
      return;
    }

    blocks.move(from, to);
  };

  const handleDragCancel = () => {
    setIsSorting(false);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={blocks.fields.map(({ type }) => type)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid min-w-0 gap-2">
          {blocks.fields.map((block, index) => (
            <TemplateBlockCard
              key={block.type}
              block={block}
              form={form}
              index={index}
              isSorting={isSorting}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
