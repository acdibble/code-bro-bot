defmodule CodeBroBot.Handlers.Events do
  use GenServer

  @spec start_link(any) :: :ignore | {:error, any} | {:ok, pid}

  def start_link(_arg) do
    IO.puts("Starting events handler...")
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @spec init(:ok) :: {:ok, nil}

  def init(:ok), do: {:ok, nil}

  @spec process(Plug.Conn.t()) :: Plug.Conn.t()

  def process(%Plug.Conn{} = conn) do
    GenServer.cast(__MODULE__, conn.body_params)
    conn
  end

  def handle_cast(map, nil) when is_map(map) do
    IO.puts("Handling new event: #{inspect(map)}")
    {:noreply, nil}
  end
end
