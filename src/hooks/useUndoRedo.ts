import { useState, useCallback } from 'react';

interface Options {
    maxHistory?: number;
}

export function useUndoRedo<T>(initialState: T | (() => T), options: Options = {}) {
    const { maxHistory = 50 } = options;
    const [past, setPast] = useState<T[]>([]);
    const [present, setPresent] = useState<T>(initialState);
    const [future, setFuture] = useState<T[]>([]);

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    const undo = useCallback(() => {
        if (!canUndo) return;

        const newPresent = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        setPast(newPast);
        setFuture([present, ...future]);
        setPresent(newPresent);
    }, [past, present, future, canUndo]);

    const redo = useCallback(() => {
        if (!canRedo) return;

        const newPresent = future[0];
        const newFuture = future.slice(1);

        setPast([...past, present]);
        setPresent(newPresent);
        setFuture(newFuture);
    }, [past, present, future, canRedo]);

    const set = useCallback((newPresentOrFn: T | ((prev: T) => T)) => {
        // Handle functional update
        const newPresent = newPresentOrFn instanceof Function
            ? (newPresentOrFn as (prev: T) => T)(present)
            : newPresentOrFn;

        if (newPresent === present) return;

        setPast((prev) => {
            const newPast = [...prev, present];
            if (newPast.length > maxHistory) {
                return newPast.slice(1);
            }
            return newPast;
        });
        setPresent(newPresent);
        setFuture([]);
    }, [present, maxHistory]);

    const reset = useCallback((newPresent: T) => {
        setPast([]);
        setPresent(newPresent);
        setFuture([]);
    }, []);

    return {
        state: present,
        setState: set,
        resetState: reset,
        undo,
        redo,
        canUndo,
        canRedo,
        past,
        future
    };
}
