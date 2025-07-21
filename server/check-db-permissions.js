const { Client } = require('pg');

async function checkDatabasePermissions() {
  const client = new Client({
    connectionString: "postgresql://postgres:d5S.99pl17%28P@blogdb-instance-1.c1ckku6quofn.ap-southeast-2.rds.amazonaws.com:5432/blogDB?sslmode=disable",
    ssl: false
  });

  try {
    console.log('🔗 连接数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功！');

    // 检查当前用户权限
    const userResult = await client.query('SELECT current_user, session_user;');
    console.log('👤 当前用户:', userResult.rows[0]);

    // 检查数据库权限
    const privResult = await client.query(`
      SELECT table_catalog, table_schema, table_name, privilege_type 
      FROM information_schema.table_privileges 
      WHERE grantee = current_user AND table_schema = 'public'
      LIMIT 10;
    `);
    console.log('🔐 用户权限:', privResult.rows);

    // 检查现有表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('📋 现有表:', tablesResult.rows.map(row => row.table_name));

    // 尝试创建测试表
    try {
      await client.query('CREATE TABLE IF NOT EXISTS test_permissions (id SERIAL PRIMARY KEY, name VARCHAR(50));');
      console.log('✅ 具有创建表权限');
      
      await client.query('DROP TABLE IF EXISTS test_permissions;');
      console.log('✅ 具有删除表权限');
    } catch (error) {
      console.error('❌ 权限问题:', error.message);
    }

    await client.end();
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  }
}

checkDatabasePermissions();