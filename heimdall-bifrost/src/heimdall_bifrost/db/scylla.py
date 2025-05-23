from cassandra.cluster import Cluster

def get_scylla_session(hosts=["127.0.0.1"], keyspace="metrics"):
    cluster = Cluster(hosts)
    session = cluster.connect()
    session.execute(f"""
        CREATE KEYSPACE IF NOT EXISTS {keyspace}
        WITH replication = {{'class': 'SimpleStrategy', 'replication_factor': '1'}}
    """)
    session.set_keyspace(keyspace)
    session.execute("""
        CREATE TABLE IF NOT EXISTS metric_data (
            id uuid PRIMARY KEY,
            message text,
            received_at timestamp
        )
    """)
    return session