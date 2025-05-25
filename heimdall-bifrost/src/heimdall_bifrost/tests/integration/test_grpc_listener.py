import grpc
import pytest

from listener import metric_pb2, metric_pb2_grpc

@pytest.fixture(scope="module")
def grpc_channel():
    channel = grpc.insecure_channel('localhost:50051')
    try:
        grpc.channel_ready_future(channel).result(timeout=10)
        yield channel
    finally:
        channel.close()

@pytest.fixture
def grpc_stub(grpc_channel):
    return metric_pb2_grpc.metricServiceStub(grpc_channel)

def test_grpc_listener_connection(grpc_stub):
    """Test the gRPC server with a simple client."""
    request = metric_pb2.MetricRequest(
        eventType="test_connection",
        data='{"test": "data", "timestamp": "now"}'
    )
    response = grpc_stub.SendMetric(request)
    assert response.status == "success"
    assert "test" in response.message.lower()
