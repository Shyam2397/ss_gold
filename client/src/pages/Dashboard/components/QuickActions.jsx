import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiActivity, FiRefreshCw, FiTag, FiUserPlus, FiZap } from 'react-icons/fi';
import { Card, CardHeader, EmptyState } from './Card';
import { useUser } from '../../../components/UserInterface/UserContext';

const ACTIONS = [
  { label: 'Register Sample', path: '/token', icon: FiTag },
  { label: 'Start Testing', path: '/skin-testing', icon: FiActivity },
  { label: 'New Customer', path: '/entries', icon: FiUserPlus },
  { label: 'Pure Exchange', path: '/pure-exchange', icon: FiRefreshCw },
];

const QuickActions = ({ corner }) => {
  const navigate = useNavigate();
  const { canAccess } = useUser();

  const actions = useMemo(() => ACTIONS.filter((action) => canAccess(action.path)), [canAccess]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader icon={FiZap} title="Quick Actions" subtitle="Common tasks" />
      <div className="flex-1 p-5">
        {actions.length > 0 ? (
          <div className="flex h-full flex-col gap-3">
            {corner}
            <div className="grid grid-cols-4 gap-1.5">
              {actions.map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className="group flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border border-hairline bg-white px-1 py-2 text-center transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:bg-gold/5 hover:shadow-sm"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-white">
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="text-[10px] font-medium leading-tight text-ink">{label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={FiZap}
            title="No quick actions available"
            message="Ask an administrator to grant you access to the relevant menus."
          />
        )}
      </div>
    </Card>
  );
};

export default QuickActions;
