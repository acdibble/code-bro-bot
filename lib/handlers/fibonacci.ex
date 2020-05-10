defmodule Fibonacci do
  @doc ~S"""
  Returns number in nth position of fibonacci sequence

  ## Examples
      iex> Fibonacci.get(0)
      0
      iex> Fibonacci.get(1)
      1
      iex> Fibonacci.get(10)
      55
      iex> Fibonacci.get(-1)
      0
  """

  @spec get(integer(), non_neg_integer(), non_neg_integer()) :: non_neg_integer()
  def get(n, a \\ 0, b \\ 1)

  def get(n, _, _b) when n < 0, do: 0
  def get(0, a, _b), do: a
  def get(1, _a, b), do: b
  def get(n, a, b), do: get(n - 1, b, a + b)
end
