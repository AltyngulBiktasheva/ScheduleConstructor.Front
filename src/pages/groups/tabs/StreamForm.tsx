import React, { useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { Group, Stream } from '../../../types/group';
import styles from './StreamForm.module.scss';
import {v4 as uuidv4} from "uuid";

interface Props {
  initial?: Stream;
  groups?: Group[];
  streams?: Stream[];
  onSave: (s: Stream) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export const StreamForm: React.FC<Props> = ({
  initial, groups = [], streams = [], onSave, onCancel, loading,
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [semesterNumber, setSemesterNumber] = useState(initial?.semesterNumber ?? 1);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(initial?.groupIds ?? []);
  const [expandedStreamIds, setExpandedStreamIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Groups not belonging to any stream (or whose stream is not in the streams list)
  const otherStreams = streams.filter((s) => s.id !== initial?.id);
  const ungroupedGroups = groups.filter(
    (g) => !otherStreams.some((s) => s.groupIds.includes(g.id)),
  );

  const toggleGroup = (id: string) =>
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );

  const toggleStreamGroups = (stream: Stream) => {
    const streamGroupIds = groups
      .filter((g) => stream.groupIds.includes(g.id))
      .map((g) => g.id);
    const allSelected = streamGroupIds.length > 0 &&
      streamGroupIds.every((id) => selectedGroupIds.includes(id));

    if (allSelected) {
      setSelectedGroupIds((prev) => prev.filter((id) => !streamGroupIds.includes(id)));
    } else {
      setSelectedGroupIds((prev) => [...new Set([...prev, ...streamGroupIds])]);
    }
  };

  const toggleExpanded = (streamId: string) =>
    setExpandedStreamIds((prev) => {
      const next = new Set(prev);
      next.has(streamId) ? next.delete(streamId) : next.add(streamId);
      return next;
    });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Обязательное поле';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    // Deduplicate just in case
    const childIds = [...new Set(selectedGroupIds)];
    onSave({
      id: initial?.id ?? uuidv4(),
      name: name.trim(),
      semesterNumber,
      groupIds: childIds,
      disciplineIds: initial?.disciplineIds ?? [],
    });
  };

  const hasGroups = otherStreams.length > 0 || ungroupedGroups.length > 0;

  return (
    <div className={styles.form}>
      <FormField
        label="Название потока"
        required
        error={errors.name}
        hint="Например: Поток МЕН-2023"
      >
        <input
          className="field-input"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
          placeholder="Поток МЕН-2023"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </FormField>

      <FormField label="Номер семестра">
        <input
          className="field-input"
          type="number"
          min={0}
          max={12}
          value={semesterNumber}
          onChange={(e) => setSemesterNumber(Math.min(12, parseInt(e.target.value) || 0))}
          style={{ width: 120 }}
        />
      </FormField>

      <FormField
        label="Группы в потоке"
        hint="Необязательно. Выберите существующие группы для добавления в поток."
      >
        {!hasGroups ? (
          <span className={styles.noGroups}>Нет созданных групп</span>
        ) : (
          <div className={styles.treeRoot}>
            {/* Streams with their groups */}
            {otherStreams.map((s) => {
              const sGroups = groups.filter((g) => s.groupIds.includes(g.id));
              if (sGroups.length === 0) return null;
              const expanded = expandedStreamIds.has(s.id);
              const allSelected = sGroups.every((g) => selectedGroupIds.includes(g.id));
              const someSelected = sGroups.some((g) => selectedGroupIds.includes(g.id));

              return (
                <div key={s.id} className={styles.treeStream}>
                  <div className={styles.treeStreamRow}>
                    <button
                      type="button"
                      className={styles.expandBtn}
                      onClick={() => toggleExpanded(s.id)}
                      aria-label={expanded ? 'Свернуть' : 'Развернуть'}
                    >
                      {expanded ? '▾' : '▸'}
                    </button>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = !allSelected && someSelected;
                        }}
                        onChange={() => toggleStreamGroups(s)}
                      />
                      <span className={styles.streamName}>{s.name}</span>
                      <span className={styles.groupCount}>{sGroups.length} гр.</span>
                    </label>
                  </div>
                  {expanded && (
                    <div className={styles.treeChildren}>
                      {sGroups.map((g) => (
                        <label key={g.id} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={selectedGroupIds.includes(g.id)}
                            onChange={() => toggleGroup(g.id)}
                          />
                          <span>{g.name}</span>
                          <span className={styles.groupCount}>{g.studentCount} чел.</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Groups not belonging to any other stream */}
            {ungroupedGroups.length > 0 && (
              <div className={styles.ungrouped}>
                {otherStreams.some((s) => groups.some((g) => s.groupIds.includes(g.id))) && (
                  <span className={styles.ungroupedLabel}>Без потока</span>
                )}
                {ungroupedGroups.map((g) => (
                  <label key={g.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                    />
                    <span>{g.name}</span>
                    <span className={styles.groupCount}>{g.studentCount} чел.</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </FormField>

      <div className={styles.actions}>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Отмена</Button>
        )}
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
};
