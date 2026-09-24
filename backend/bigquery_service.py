from google.cloud import bigquery

PROJECT_ID = "krishisetu-509305"
DATASET_ID = "krishisetu"

client = bigquery.Client(project=PROJECT_ID)


def upsert_row(table_name, row, schema, key_field="id"):
    table_id = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"

    try:
        client.get_table(table_id)
    except Exception:
        client.create_table(
            bigquery.Table(table_id, schema=schema)
        )

    columns = list(row.keys())

    query = f"""
    DELETE FROM `{table_id}`
    WHERE {key_field} = @row_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "row_id",
                "INT64",
                row[key_field],
            )
        ]
    )

    client.query(query, job_config=job_config).result()

    load_config = bigquery.LoadJobConfig(
        schema=schema,
        write_disposition="WRITE_APPEND",
    )

    client.load_table_from_json(
        [row],
        table_id,
        job_config=load_config,
    ).result()

    print(f"BigQuery synced: {table_name} id={row[key_field]}")