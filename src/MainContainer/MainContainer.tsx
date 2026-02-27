import type {FC} from "react";
import {useEffect, useState} from "react";
import type {PlacedDiscipline} from "../types/discipline.types.ts";
import {INITIAL_DISCIPLINES} from "../constants/disciplines.constants.ts";
import {DisciplinesPanel} from "../components/DisciplinesPanel/DisciplinesPanel.tsx";
import {ScheduleGrid} from "../components/ScheduleGrid/ScheduleGrid.tsx";
import styles from "./MainContainer.module.scss";

export const MainContainer: FC = () => {
    const [placedDisciplines, setPlacedDisciplines] = useState<PlacedDiscipline[]>([]);
    const [availableDisciplines, setAvailableDisciplines] = useState(INITIAL_DISCIPLINES);

    useEffect(() => {
        console.log('Placed disciplines: ', placedDisciplines)
    }, [placedDisciplines]);

    const handleDisciplinePlaced = (discipline: PlacedDiscipline) => {
        setPlacedDisciplines(prev => [...prev, discipline]);
        // Опционально: удаляем из доступных, если дисциплина уникальна
        setAvailableDisciplines(prev => prev.filter(d => d.id !== discipline.id));
    };

    const handleDisciplineMoved = (discipline: PlacedDiscipline) => {
        setPlacedDisciplines(prev =>
            prev.map(d => d.id === discipline.id ? discipline : d)
        );
    };

    const handleDisciplineRemoved = (disciplineId: string | number) => {
        setPlacedDisciplines(prev => prev.filter(d => d.id !== disciplineId));
        // Опционально: возвращаем в доступные
        const removed = placedDisciplines.find(d => d.id === disciplineId);
        if (removed) {
          const { day, startTime, endTime, ...discipline } = removed;
          setAvailableDisciplines(prev => [...prev, discipline]);
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>🎓 Конструктор расписания</h1>
                <p className="subtitle">Перетаскивайте дисциплины из панели справа в сетку расписания</p>
            </header>

            <main className={styles.appMain}>
                <ScheduleGrid
                    placedDisciplines={placedDisciplines}
                    onDisciplinePlaced={handleDisciplinePlaced}
                    onDisciplineMoved={handleDisciplineMoved}
                    onDisciplineRemoved={handleDisciplineRemoved}
                />

                <DisciplinesPanel
                    disciplines={availableDisciplines}
                    onDragStart={(discipline) => console.log('Drag start:', discipline)}
                />
            </main>

            <footer className="app-footer">
                <p>Размещено дисциплин: {placedDisciplines.length}</p>
            </footer>
        </div>
    );
};