import { useState, useRef, useEffect, KeyboardEvent, CSSProperties, MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { Move } from 'lucide-react';

interface DraggableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  multiline?: boolean;
  enableDrag?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export function DraggableText({
  value,
  onChange,
  placeholder = 'Clique para editar',
  className,
  style,
  as: Component = 'span',
  multiline = false,
  enableDrag = true,
  position,
  onPositionChange,
}: DraggableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [showDragHandle, setShowDragHandle] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: MouseEvent) => {
    if (!isDragging) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleDragStart = (e: MouseEvent) => {
    if (!enableDrag || !onPositionChange) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialPos.current = position || { x: 0, y: 0 };
    
    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartPos.current.x;
      const deltaY = moveEvent.clientY - dragStartPos.current.y;
      
      onPositionChange({
        x: initialPos.current.x + deltaX,
        y: initialPos.current.y + deltaY,
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const containerStyle: CSSProperties = {
    ...style,
    ...(position && onPositionChange ? {
      position: 'relative' as const,
      left: `${position.x}px`,
      top: `${position.y}px`,
    } : {}),
  };

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    return (
      <div 
        ref={containerRef}
        className="relative inline-block"
        style={containerStyle}
      >
        <InputComponent
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'bg-transparent border-b border-resume-accent focus:outline-none focus:border-resume-primary w-full',
            'transition-colors duration-200',
            multiline && 'resize-none min-h-[60px]',
            className
          )}
          style={style}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block group"
      style={containerStyle}
      onMouseEnter={() => setShowDragHandle(true)}
      onMouseLeave={() => !isDragging && setShowDragHandle(false)}
    >
      {enableDrag && onPositionChange && showDragHandle && (
        <button
          className="absolute -left-5 top-1/2 -translate-y-1/2 p-0.5 cursor-move opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 rounded hover:bg-primary/20 print:hidden"
          onMouseDown={handleDragStart}
          title="Arraste para mover"
        >
          <Move className="w-3 h-3 text-primary" />
        </button>
      )}
      <Component
        onClick={handleClick}
        className={cn(
          'cursor-text hover:bg-resume-accent/20 rounded px-1 -mx-1 transition-colors duration-200',
          !value && 'text-resume-muted italic',
          isDragging && 'cursor-grabbing',
          className
        )}
        style={style}
      >
        {value || placeholder}
      </Component>
    </div>
  );
}