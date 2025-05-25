from concurrent import futures
import grpc
from listener import metric_pb2, metric_pb2_grpc
from loguru import logger
import signal
import sys


class MetricService(metric_pb2_grpc.metricServiceServicer):
    def SendMetric(self, request, context):
        """
        Handles incoming metric data via gRPC, logs the received event, and returns a response.
        Args:
            request (metric_pb2.MetricRequest): The incoming gRPC request containing metric data and event type.
            context (grpc.ServicerContext): The gRPC context for the request.
        Returns:
            metric_pb2.MetricResponse: A response indicating the status of the metric ingestion.
        Logs:
            - Info log for the received event type.
            - Debug log for the received data.
            - Exception log if an error occurs during processing.
        Raises:
            Returns an error response if any exception is encountered during processing.
        """
        try:
            logger.info("Received Metric: {}", request.eventType)
            logger.debug("Data: {}", request.data)
            
            # TODO: Ingest Data to ScyllaDB

            return metric_pb2.MetricResponse(
                status="success", message=f"Metric received: {request.eventType}"
            )
        except Exception as e:
            logger.exception("⚠️ Error Processing Metric!")
            return metric_pb2.MetricResponse(status="error", message=f"Error: {str(e)}")


def serve():
    """
    Starts and manages the lifecycle of a gRPC server for the MetricService.
    - Initializes a gRPC server with a thread pool executor.
    - Registers the MetricService with the server.
    - Binds the server to port 50051 and logs the binding.
    - Handles graceful shutdown on SIGINT and SIGTERM signals.
    - Starts the server and waits for termination, logging success or failure.
    Raises:
        SystemExit: If the server fails to start or is shut down.
    """
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    metric_pb2_grpc.add_metricServiceServicer_to_server(MetricService(), server)
    port = server.add_insecure_port("[::]:50051")
    logger.info("Server Bounded to Port: {}", port)

    def shutdown(*_):
        logger.info("💤 Shutting Down gRPC Listener...")
        server.stop(0)
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        server.start()
        logger.success("✅ gRPC Listener Started Successfully on Port: 50051")
        server.wait_for_termination()
    except Exception as e:
        logger.exception(f"🚨 Failed to Start gRPC Listener: {e}")
        sys.exit(1)


if __name__ == "__main__":
    serve()
