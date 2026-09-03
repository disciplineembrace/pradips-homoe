#!/usr/bin/env python3
"""Check Neon database status, storage, and tables."""
import psycopg2

DB_URL = "postgresql://neondb_owner:npg_1wTMmqx2yEAb@ep-ancient-star-aorzj9ne-pooler.c-2.ap-southeast-1.aws.neon.tech/Homeopradip?sslmode=require"

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    print("=" * 60)
    print("NEON DATABASE STATUS REPORT")
    print("=" * 60)
    
    # Database size
    cur.execute("SELECT pg_size_pretty(pg_database_size('Homeopradip'));")
    db_size = cur.fetchone()[0]
    print(f"\nDatabase 'Homeopradip' size: {db_size}")
    
    cur.execute("SELECT pg_database_size('Homeopradip');")
    db_size_bytes = cur.fetchone()[0]
    print(f"  In bytes: {db_size_bytes:,}")
    print(f"  In MB: {db_size_bytes/1024/1024:.2f} MB")
    print(f"  In GB: {db_size_bytes/1024/1024/1024:.4f} GB")
    print(f"  Neon Free Plan limit: 0.5 GB (500 MB)")
    print(f"  Storage usage: {db_size_bytes/1024/1024/500*100:.2f}% of 500 MB")
    print(f"  Remaining: {500 - db_size_bytes/1024/1024:.2f} MB")
    
    # Active connections
    cur.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active';")
    active_conns = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM pg_stat_activity;")
    total_conns = cur.fetchone()[0]
    print(f"\nActive connections: {active_conns}")
    print(f"Total connections: {total_conns}")
    print(f"Neon Free Plan limit: 100 concurrent connections")
    
    # Tables and sizes
    print("\n" + "=" * 60)
    print("TABLES AND SIZES")
    print("=" * 60)
    cur.execute("""
        SELECT 
            schemaname AS schema,
            relname AS table_name,
            pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
            pg_size_pretty(pg_relation_size(relid)) AS data_size,
            n_live_tup AS row_count
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC;
    """)
    tables = cur.fetchall()
    print(f"\n{'Schema':<12}{'Table':<25}{'Total Size':<15}{'Data Size':<15}{'Rows':<12}")
    print("-" * 80)
    for t in tables:
        print(f"{t[0]:<12}{t[1]:<25}{t[2]:<15}{t[3]:<15}{str(t[4]):<12}")
    
    # Database version
    cur.execute("SELECT version();")
    version = cur.fetchone()[0]
    print(f"\nPostgreSQL version: {version}")
    
    # Recent activity - login logs count
    for table in ['"LoginLog"', '"User"', '"AuditLog"', '"PinLog"', '"DeviceSession"', '"WebAuthnCredential"']:
        try:
            cur.execute(f"SELECT count(*) FROM {table};")
            cnt = cur.fetchone()[0]
            print(f"{table} count: {cnt}")
        except Exception as e:
            conn.rollback()
            print(f"{table}: NOT PRESENT")
    
    cur.close()
    conn.close()
    print("\n" + "=" * 60)
    print("Neon database check COMPLETE")
    print("=" * 60)
except Exception as e:
    print(f"ERROR: {e}")
