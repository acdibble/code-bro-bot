defmodule CodeBroBot.Handlers.Events do
  use GenServer

  @spec start_link(any) :: :ignore | {:error, any} | {:ok, pid}

  def start_link(_arg) do
    IO.puts("Starting events handler...")
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @spec init(:ok) :: {:ok, nil}

  @impl true
  def init(:ok), do: {:ok, nil}

  @spec process(Plug.Conn.t()) :: Plug.Conn.t()

  def process(%Plug.Conn{} = conn) do
    GenServer.cast(__MODULE__, conn.body_params)
    conn
  end

  @impl true
  def handle_cast(
        %{"event" => %{"type" => "app_mention", "channel" => channel, "text" => text} = body},
        nil
      ) do
    Task.Supervisor.async_nolink(CodeBroBot.Handlers.TaskSupervisor, fn ->
      CodeBroBot.Slack.Request.call(%{
        "channel" => channel,
        "text" => "I don't know what to do with my hands."
      })
    end)

    {:noreply, nil}
  end

  @impl true
  def handle_cast(map, nil) when is_map(map) do
    IO.puts("Handling unknown event: #{inspect(map)}")
    {:noreply, nil}
  end

  @impl true
  def handle_info({ref, result}, nil) when is_reference(ref) do
    IO.puts("Request returned:")
    IO.inspect(result)
    {:noreply, nil}
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, _pid, status}, nil) do
    IO.puts("Reference exited with status: #{status}")
    {:noreply, nil}
  end
end
