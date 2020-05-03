defmodule CodeBroBot.Handlers.Supervisor do
  use Supervisor

  @spec start_link(any) :: :ignore | {:error, any} | {:ok, pid}
  def start_link(_arg) do
    IO.puts("Starting handlers supervisor...")
    Supervisor.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    children = [
      CodeBroBot.Handlers.Events
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
