import React from 'react';

export const Girl1Avatar = () => (
  <img src="/assets/avatars/girl 1.png" alt="Girl 1" className="w-full h-full object-cover rounded-full" />
);

export const Girl2Avatar = () => (
  <img src="/assets/avatars/girl 2.png" alt="Girl 2" className="w-full h-full object-cover rounded-full" />
);

export const Girl3Avatar = () => (
  <img src="/assets/avatars/girl 3.png" alt="Girl 3" className="w-full h-full object-cover rounded-full" />
);

export const Boy1Avatar = () => (
  <img src="/assets/avatars/boy 1.png" alt="Boy 1" className="w-full h-full object-cover rounded-full" />
);

export const Boy2Avatar = () => (
  <img src="/assets/avatars/boy 2.png" alt="Boy 2" className="w-full h-full object-cover rounded-full" />
);

export const Boy3Avatar = () => (
  <img src="/assets/avatars/boy 3.png" alt="Boy 3" className="w-full h-full object-cover rounded-full" />
);

export const AVATARS = [
  { id: 'girl1', label: 'girl1', Component: Girl1Avatar },
  { id: 'girl2', label: 'girl2', Component: Girl2Avatar },
  { id: 'girl3', label: 'girl3', Component: Girl3Avatar },
  { id: 'boy1',  label: 'boy1',  Component: Boy1Avatar  },
  { id: 'boy2',  label: 'boy2',  Component: Boy2Avatar  },
  { id: 'boy3',  label: 'boy3',  Component: Boy3Avatar  },
];
