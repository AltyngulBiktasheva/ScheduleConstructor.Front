import React from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import styles from './TourModal.module.scss';

type ModalType = 'welcome' | 'resume' | 'deviation' | 'completion' | 'offer-next';

interface Props {
  type: ModalType;
  tourTitle: string;
  tourDescription?: string;
  stepCount?: number;
  currentStep?: number;
  onPrimary: () => void;
  onSecondary?: () => void;
}

const CONFIG: Record<ModalType, {
  title: (tourTitle: string) => string;
  primaryLabel: string;
  secondaryLabel?: string;
}> = {
  welcome: {
    title: (t) => t,
    primaryLabel: 'Начать',
    secondaryLabel: 'Пропустить',
  },
  resume: {
    title: () => 'Продолжить тур?',
    primaryLabel: 'Продолжить',
    secondaryLabel: 'Закончить тур',
  },
  deviation: {
    title: () => 'Тур приостановлен',
    primaryLabel: 'Понятно',
  },
  completion: {
    title: () => 'Тур завершён!',
    primaryLabel: 'Готово',
  },
  'offer-next': {
    title: () => 'Продолжить знакомство?',
    primaryLabel: 'Да, начать',
    secondaryLabel: 'Нет, спасибо',
  },
};

export const TourModal: React.FC<Props> = ({
  type,
  tourTitle,
  tourDescription,
  stepCount,
  currentStep,
  onPrimary,
  onSecondary,
}) => {
  const cfg = CONFIG[type];

  const bodyText = (): string => {
    switch (type) {
      case 'welcome':
        return (
          (tourDescription || '') +
          (stepCount ? `\n\nВ туре ${stepCount} шагов. Вы можете прервать его в любой момент.` : '')
        );
      case 'resume':
        return currentStep != null && stepCount
          ? `Вы остановились на шаге ${currentStep + 1} из ${stepCount}. Хотите продолжить?`
          : 'Хотите продолжить тур с того места, где остановились?';
      case 'deviation':
        return 'Вы перешли на другую страницу. Нажмите «Ознакомительный тур» в боковом меню, чтобы продолжить.';
      case 'completion':
        return 'Поздравляем! Вы познакомились со всеми разделами. Теперь можете приступать к работе.';
      case 'offer-next':
        return 'Вы завершили тур для составителя. Хотите пройти тур для преподавателя?';
    }
  };

  const actions = (
    <div className={styles.actions}>
      {cfg.secondaryLabel && onSecondary && (
        <Button variant="ghost" onClick={onSecondary}>
          {cfg.secondaryLabel}
        </Button>
      )}
      <Button variant="primary" onClick={onPrimary}>
        {cfg.primaryLabel}
      </Button>
    </div>
  );

  return (
    <Modal title={cfg.title(tourTitle)} onClose={onSecondary || onPrimary} width={460} actions={actions}>
      <div className={styles.body}>
        {bodyText().split('\n\n').map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Modal>
  );
};
