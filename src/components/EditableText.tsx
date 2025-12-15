import { useState, useRef, useEffect, KeyboardEvent, CSSProperties, MouseEvent, TouchEvent } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Maximize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  multiline?: boolean;
  draggable?: boolean;
  isDate?: boolean;
}

export function EditableText({
  value,
  onChange,
  placeholder = 'Clique para editar',
  className,
  style,
  as: Component = 'span',
  multiline = false,
  draggable = false,
  isDate = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showHandle, setShowHandle] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isDragging) {
      if (multiline) {
        setIsPopupOpen(true);
      } else {
        setIsEditing(true);
      }
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

  // Mouse drag handlers
  const handleDragStart = (e: MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;
      setDragOffset({
        x: dragStartRef.current.offsetX + deltaX,
        y: dragStartRef.current.offsetY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setTimeout(() => setIsDragging(false), 50);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Touch drag handlers
  const handleTouchStart = (e: TouchEvent) => {
    if (!draggable) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !draggable) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    setDragOffset({
      x: dragStartRef.current.offsetX + deltaX,
      y: dragStartRef.current.offsetY + deltaY,
    });
  };

  const handleTouchEnd = () => {
    setTimeout(() => setIsDragging(false), 50);
  };

  const containerStyle: CSSProperties = draggable ? {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
  } : {};

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
            multiline && 'resize-none min-h-[60px] pr-8',
            isDate && 'pr-8',
            className
          )}
          style={style}
          placeholder={placeholder}
        />

        {multiline && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 h-6 w-6 text-muted-foreground hover:text-primary z-10"
              onClick={(e) => {
                e.stopPropagation();
                setIsPopupOpen(true);
              }}
              onMouseDown={(e) => e.preventDefault()}
              title="Expandir editor"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>

            <Dialog open={isPopupOpen} onOpenChange={(open) => {
              setIsPopupOpen(open);
              if (!open) handleBlur();
            }}>
              <DialogContent className="sm:max-w-[725px] flex flex-col h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Editar Texto</DialogTitle>
                </DialogHeader>
                <div className="flex-1 py-4">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full h-full resize-none p-4 text-base leading-relaxed"
                    placeholder={placeholder}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsPopupOpen(false)}>Concluir</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {isDate && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-primary z-10"
                title="Selecionar data"
                onMouseDown={(e) => e.preventDefault()}
              >
                <CalendarIcon className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={(date) => {
                  if (date) {
                    const formatted = format(date, 'MMM yyyy', { locale: ptBR });
                    setEditValue(formatted);
                    onChange(formatted);
                    setIsEditing(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center group", draggable && "cursor-default")}
      style={containerStyle}
      onMouseEnter={() => draggable && setShowHandle(true)}
      onMouseLeave={() => !isDragging && setShowHandle(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {draggable && showHandle && (
        <button
          className="absolute -left-5 top-1/2 -translate-y-1/2 p-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 rounded hover:bg-primary/20 print:hidden active:cursor-grabbing"
          onMouseDown={handleDragStart}
          title="Arraste para mover"
        >
          <GripVertical className="w-3 h-3 text-primary" />
        </button>
      )}
      <Component
        onClick={handleClick}
        className={cn(
          'cursor-text hover:bg-resume-accent/20 rounded px-1 -mx-1 transition-colors duration-200',
          !value && 'text-resume-muted italic',
          className
        )}
        style={style}
      >
        {value || placeholder}
      </Component>
    </div>
  );
}
