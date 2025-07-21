import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  RobotOutlined, 
  CarryOutOutlined 
} from '@ant-design/icons';

const { Header } = Layout;

const Navbar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/agents',
      icon: <RobotOutlined />,
      label: <Link to="/agents">智能体管理</Link>,
    },
    {
      key: '/jobs',
      icon: <CarryOutOutlined />,
      label: <Link to="/jobs">任务管理</Link>,
    },
  ];

  return (
    <Header>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ 
          color: '#1890ff', 
          fontSize: '20px', 
          fontWeight: 'bold',
          marginRight: '32px'
        }}>
          Agents & Jobs
        </div>
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, border: 'none' }}
        />
      </div>
    </Header>
  );
};

export default Navbar;