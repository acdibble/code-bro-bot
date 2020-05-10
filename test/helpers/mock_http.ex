defmodule MockHttp do
  use GenServer

  def start_link(_opts), do: GenServer.start_link(__MODULE__, %{}, name: __MODULE__)

  def init(%{}), do: {:ok, %{}}

  def post(url, body, headers) do
    GenServer.call(__MODULE__, {:mock_request, [url, body, headers]})
  end

  def create_spy(text) do
    Task.async(fn ->
      GenServer.cast(__MODULE__, {self(), :create_spy, text})

      receive do
        response -> response
      end
    end)
  end

  def handle_cast({pid, :create_spy, text}, state) when is_pid(pid) do
    {:noreply, Map.put(state, text, pid)}
  end

  def handle_call({:mock_request, args}, _from, state) do
    new_state =
      Enum.at(args, 1)
      |> Jason.decode!()
      |> (fn body -> Map.pop(state, body["text"]) end).()
      |> case do
        {nil, new_state} ->
          new_state

        {pid, new_state} ->
          send(pid, args)
          new_state
      end

    {:reply, :ok, new_state}
  end
end
