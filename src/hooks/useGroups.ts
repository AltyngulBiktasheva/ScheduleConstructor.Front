import { useState, useCallback } from 'react';
import type { Group, Stream } from '../types/group';
import { MOCK_GROUPS, MOCK_STREAMS } from '../mockData/groups';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [streams, setStreams] = useState<Stream[]>(MOCK_STREAMS);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const addGroup = useCallback((group: Group) => {
    setGroups((prev) => [...prev, group]);
    setStreams((prev) =>
      prev.map((s) =>
        s.id === group.streamId ? { ...s, groupIds: [...s.groupIds, group.id] } : s
      )
    );
    markCreated(group.id);
  }, []);

  const updateGroup = useCallback((updated: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    // Update stream membership if streamId changed
    setStreams((prev) =>
      prev.map((s) => {
        const wasIn = s.groupIds.includes(updated.id);
        const shouldBe = s.id === updated.streamId;
        if (wasIn && !shouldBe) return { ...s, groupIds: s.groupIds.filter((id) => id !== updated.id) };
        if (!wasIn && shouldBe) return { ...s, groupIds: [...s.groupIds, updated.id] };
        return s;
      })
    );
  }, []);

  const removeGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setStreams((prev) =>
      prev.map((s) => ({ ...s, groupIds: s.groupIds.filter((gid) => gid !== id) }))
    );
  }, []);

  const addStream = useCallback((stream: Stream) => {
    setStreams((prev) => [...prev, stream]);
    markCreated(stream.id);
  }, []);

  const updateStream = useCallback((updated: Stream) => {
    setStreams((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const removeStream = useCallback((id: string) => {
    setStreams((prev) => prev.filter((s) => s.id !== id));
    setGroups((prev) => prev.filter((g) => g.streamId !== id));
  }, []);

  return {
    groups,
    streams,
    newlyCreatedId,
    addGroup, updateGroup, removeGroup,
    addStream, updateStream, removeStream,
  };
}
