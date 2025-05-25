# heimdall-bifrost

This project contains the backend services for the Heimdall system, including:

- FastAPI app (REST API)
- gRPC server for receiving messages
- ScyllaDB integration for storing streamed metrics

## Structure

- `src/heimdall_bifrost/app/` - FastAPI application
- `src/heimdall_bifrost/listener/` - gRPC server
- `src/heimdall_bifrost/db/` - ScyllaDB utilities and Docker setup

## Development

- Please set PYTHONPATH = "src\heimdall_bifrost" from the project root folder.
- Use the provided Dockerfiles to build images for the FastAPI and gRPC services.
- Use the Helm chart in the `helm/` directory to deploy the stack to Kubernetes.

## License

See [LICENSE](../LICENSE).
