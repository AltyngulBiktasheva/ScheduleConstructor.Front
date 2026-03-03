import React from 'react';
import type { GridSlot } from '../../types';
import { SLOT_COLORS } from '../../constants/colors';
import styles from './Styles.module.scss';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface Props {
    slot: GridSlot;
    children?: React.ReactNode;
    style?: React.CSSProperties;
}

export const TimeSlot: React.FC<Props> = ({ slot, children, style }) => {
    const slotContent = (
        <div
            className={styles.slot}
            style={{
                ...style,
                backgroundColor: SLOT_COLORS[slot.color],
                width: style?.width || 200,
                height: style?.height || 100
            }}
        >
            {children}
        </div>
    );

    if (slot.warning) {
        return (
            <Tippy content={slot.warning.message}>
                {slotContent}
            </Tippy>
        );
    }

    return slotContent;
};