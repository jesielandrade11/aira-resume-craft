import { useState, useRef, useEffect, KeyboardEvent, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  multiline?: boolean;
}

export function EditableText({
  value,
  onChange,
  placeholder = 'Clique para editar',
  className,
  style,
  as: Component = 'span',
  multiline = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

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
    setIsEditing(true);
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

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    return (
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
    );
  }

  return (
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
  );
}
