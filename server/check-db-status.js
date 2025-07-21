const { Client } = require('pg');

async function checkDatabaseStatus() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || "postgresql://postgres:d5S.99pl17%28P@blogdb-instance-1.c1ckku6quofn.ap-southeast-2.rds.amazonaws.com:5432/blogDB"
    });

    try {
        await client.connect();
        console.log('🔗 数据库连接成功');

        // 检查是否在恢复模式
        const recoveryResult = await client.query('SELECT pg_is_in_recovery();');
        console.log('🔄 恢复模式状态:', recoveryResult.rows[0].pg_is_in_recovery);

        // 检查只读状态
        const readOnlyResult = await client.query('SHOW default_transaction_read_only;');
        console.log('📖 默认事务只读:', readOnlyResult.rows[0].default_transaction_read_only);

        // 检查当前事务状态
        const transactionResult = await client.query('SHOW transaction_read_only;');
        console.log('📖 当前事务只读:', transactionResult.rows[0].transaction_read_only);

        // 检查Aurora角色
        const roleResult = await client.query("SELECT CASE WHEN pg_is_in_recovery() THEN 'Reader' ELSE 'Writer' END as aurora_role;");
        console.log('🏷️  Aurora角色:', roleResult.rows[0].aurora_role);

    } catch (error) {
        console.error('❌ 数据库连接错误:', error.message);
    } finally {
        await client.end();
    }
}

checkDatabaseStatus();