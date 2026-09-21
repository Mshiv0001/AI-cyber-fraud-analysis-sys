import React from 'react';

export default function WelcomeHeader({ user }) {
  const now = new Date();
  const hour = now.getHours();
  let greeting = 'Good morning,';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon,';
  else if (hour >= 17) greeting = 'Good evening,';

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const displayName = user?.name || 'Mohit';

  return (
    <div className="welcome-header relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-1">
      <div>
        <h2 className="text-[28px] xs:text-[30px] sm:text-[36px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] leading-tight tracking-tight welcome-greeting">
          {greeting} {displayName} !!
        </h2>
        <p className="text-[13px] sm:text-[14px] text-[#58709A] dark:text-[#94A3B8] mt-1 sm:mt-1.5 leading-normal welcome-subtitle">
          Scan batch data. Detect fraud anomalies. Make a safer tomorrow.
        </p>
      </div>
      <div
        className="welcome-date-container shrink-0 flex flex-col items-center justify-center gap-1.5 text-center"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <p
          className="text-[13px] sm:text-[13.5px] font-semibold text-[#29466F] dark:text-[#94A3B8] welcome-date text-center"
          style={{
            margin: 0,
            textAlign: 'center',
            alignSelf: 'center',
            width: '100%',
          }}
        >
          {dateStr}
        </p>
        <div
          className="stay-alert-badge inline-flex items-center rounded-full shadow-sm"
          style={{
            height: '24px',
            paddingLeft: '7px',
            paddingRight: '8px',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 500,
            alignSelf: 'center',
            margin: '0 auto',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" className="stay-alert-icon" style={{ flexShrink: 0 }} aria-hidden="true">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
          <span className="stay-alert-text" style={{ lineHeight: 1 }}>Stay alert. Stay ahead.</span>
        </div>
      </div>
    </div>
  );
}
