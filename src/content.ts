(() => {
  let isTimeDisplayEnabled = true;
  let lastRecordedTime = '';
  let originalPageTitle = document.title;
  let updateIntervalId: number | null = null;

  const TIMER_SELECTORS = {
    hoursMinutesOld: '[class*="Timer-module__hoursMinutes"]',
    secondsOld: '[class*="Timer-module__seconds"]',
    timerContainerOld: '[class*="Timer-module__timer"]',
    summaryDuration:
      '[class*="SummaryTimeClock-module__duration"][data-state="overtime"]',
    breakDuration:
      '[class*="SummaryTimeClock-module__duration"][data-state="break"]',
    timeClockContainer: '[class*="TimeClock-module__timeClockContainer"]',
    workTimeByAria: '[aria-label="Work"]',
    breakTimeByAria: '[aria-label="Break"]',
    label: '#label',
  } as const;

  function initializeExtensionState(): void {
    chrome.storage.sync.get(['timeDisplayEnabled'], (result) => {
      isTimeDisplayEnabled = result.timeDisplayEnabled ?? true;
      if (isTimeDisplayEnabled) {
        startTimeUpdates();
      }
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.timeDisplayEnabled) {
        isTimeDisplayEnabled = changes.timeDisplayEnabled.newValue;
        if (isTimeDisplayEnabled) {
          startTimeUpdates();
        } else {
          stopTimeUpdates();
          restoreOriginalTitle();
        }
      }
    });
  }

  function updateBrowserTabTitle(): void {
    if (!isTimeDisplayEnabled) return;
    const hoursMinutesElement = document.querySelector<HTMLElement>(
      TIMER_SELECTORS.hoursMinutesOld
    );
    const secondsElement = document.querySelector<HTMLElement>(
      TIMER_SELECTORS.secondsOld
    );

    console.log('[TTT Extension] Old timer elements found:', {
      hoursMinutes: !!hoursMinutesElement,
      seconds: !!secondsElement,
    });

    if (hoursMinutesElement && secondsElement) {
      const hoursMinutesText = hoursMinutesElement.textContent?.trim() ?? '';
      const secondsText = secondsElement.textContent?.trim() ?? '';

      if (hoursMinutesText && secondsText) {
        const currentTime = `${hoursMinutesText}:${secondsText}`;

        if (currentTime === lastRecordedTime) return;
        lastRecordedTime = currentTime;

        const labelElement = document.querySelector<HTMLElement>(
          TIMER_SELECTORS.label
        );
        const workLabel = labelElement?.textContent?.trim() ?? 'Work';

        const newTitle = `🕒 ${currentTime} - ${workLabel}`;
        if (document.title !== newTitle) {
          document.title = newTitle;
        }
        return;
      }
    }

    let summaryDurationElement = document.querySelector<HTMLElement>(
      TIMER_SELECTORS.summaryDuration
    );
    let breakDurationElement = document.querySelector<HTMLElement>(
      TIMER_SELECTORS.breakDuration
    );

    if (!summaryDurationElement) {
      summaryDurationElement = document.querySelector<HTMLElement>(
        TIMER_SELECTORS.workTimeByAria
      );
    }
    if (!breakDurationElement) {
      breakDurationElement = document.querySelector<HTMLElement>(
        TIMER_SELECTORS.breakTimeByAria
      );
    }

    console.log('[TTT Extension] New summary elements found:', {
      workDuration: !!summaryDurationElement,
      breakDuration: !!breakDurationElement,
      workText: summaryDurationElement?.textContent?.trim(),
      breakText: breakDurationElement?.textContent?.trim(),
    });

    if (summaryDurationElement) {
      const workTime = summaryDurationElement.textContent?.trim() ?? '';
      const breakTime = breakDurationElement?.textContent?.trim() ?? '';

      if (workTime) {
        const currentTime = breakTime
          ? `${workTime} (Break: ${breakTime})`
          : workTime;

        if (currentTime === lastRecordedTime) return;
        lastRecordedTime = currentTime;

        const newTitle = `🕒 ${currentTime} - Work`;
        if (document.title !== newTitle) {
          document.title = newTitle;
        }
        return;
      }
    }

    restoreOriginalTitle();
  }

  function restoreOriginalTitle(): void {
    if (document.title !== originalPageTitle) {
      document.title = originalPageTitle;
    }
  }

  function startTimeUpdates(): void {
    if (updateIntervalId !== null) return;
    updateIntervalId = window.setInterval(updateBrowserTabTitle, 1000);
  }

  function stopTimeUpdates(): void {
    if (updateIntervalId !== null) {
      clearInterval(updateIntervalId);
      updateIntervalId = null;
    }
  }

  function watchForTimerElements(): void {
    const observer = new MutationObserver(() => {
      const oldTimerExists = !!document.querySelector(
        TIMER_SELECTORS.timerContainerOld
      );
      const newTimerExists = !!document.querySelector(
        TIMER_SELECTORS.timeClockContainer
      );

      if ((oldTimerExists || newTimerExists) && isTimeDisplayEnabled) {
        updateBrowserTabTitle();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  initializeExtensionState();
  watchForTimerElements();
})();
