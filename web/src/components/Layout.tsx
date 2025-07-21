import React from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const { Content } = AntLayout;

const Layout: React.FC = () => {
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px' }}>
        <Outlet />
      </Content>
    </AntLayout>
  );
};

export default Layout;