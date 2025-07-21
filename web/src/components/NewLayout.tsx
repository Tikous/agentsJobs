import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Bot, Briefcase, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const NewLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const navigation = [
    {
      name: '首页',
      href: '/',
      icon: Home,
      current: location.pathname === '/',
    },
    {
      name: '智能体管理',
      href: '/agents',
      icon: Bot,
      current: location.pathname.startsWith('/agents'),
    },
    {
      name: '任务管理',
      href: '/jobs',
      icon: Briefcase,
      current: location.pathname.startsWith('/jobs'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b bg-card">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
                <h1 className="text-xl font-bold text-primary">
                  Agents & Jobs
                </h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:ml-10 lg:flex lg:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors",
                        item.current
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {sidebarOpen && (
          <div className="lg:hidden">
            <div className="pt-2 pb-3 space-y-1 border-t">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center pl-3 pr-4 py-2 text-base font-medium transition-colors",
                      item.current
                        ? "bg-primary/10 text-primary border-r-4 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default NewLayout;