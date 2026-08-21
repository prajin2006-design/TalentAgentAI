import React from 'react';
import './ProgressBar.css';

export const ProgressBar = ({ currentStep, totalSteps = 5, steps = [] }) => {
  const defaultSteps = ['Basic', 'Education', 'Skills', 'Experience', 'Career Goals'];
  const stepList = steps.length ? steps : defaultSteps;

  return (
    <div className="onboarding-progress-wrapper">
      <div className="progress-steps-flex">
        {stepList.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div
              key={label}
              className={`progress-step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="step-circle">
                {isCompleted ? '✓' : `0${stepNum}`}
              </div>
              <span className="step-label">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};
