'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Loader2 } from 'lucide-react'

import axios from 'axios'
import { CryptoDataClient } from '@/utils/utilsClient'

const columns: ColumnDef<CryptoDataClient>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'symbol',
    header: 'Symbol',
    cell: ({ row }) => {
      return <div className='capitalize'>{row.getValue('symbol')}</div>
    },
  },
  {
    accessorKey: 'exchangeId',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Exchange
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className='lowercase'>{row.getValue('exchangeId')}</div>
    ),
  },

  {
    accessorKey: 'price',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Price
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className='lowercase'>
        {row.getValue('price')}
      </div>
    ),
  },
  {
    accessorKey: 'quoteVolume',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Volume
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className='lowercase'>
        {Math.round(
          ((row.getValue('quoteVolume') as number) + Number.EPSILON) * 100
        ) / 100}
      </div>
    ),
  },
  {
    accessorKey: 'priceChange',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Change
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div
        className={`lowercase text-xl ${(row.getValue('priceChange') as number) > 0 ? 'text-red-500' : 'text-green-500'}`}
      >
        {Math.round(
          ((row.getValue('priceChange') as number) * 100 + Number.EPSILON) * 1000
        ) / 1000}
      </div>
    ),
  },
]

export default function Page() {
  const [data, setData] = React.useState<CryptoDataClient[]>([])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  //get lowest prices
  const getLowestPrices = (
    data: CryptoDataClient[]
  ): Record<string, number> => {
    return data.reduce(
      (acc: Record<string, number>, item: CryptoDataClient) => {
        // If no entry for the symbol exists, or the current item's low is lower than the existing one
        if (!acc[item.symbol] || item.price < acc[item.symbol]) {
          acc[item.symbol] = item.price // Update the record with the new lower price
        }
        return acc
      },
      {}
    )
  }
  const cryptoPairs = [
    'BTC/USDT',
    'ETH/USDT',
    'XRP/USDT',
    'BCH/USDT',
    'LTC/USDT',
    'EOS/USDT',
    'XTZ/USDT',
    'LINK/USDT',
    'SOL/USDT',
    'ADA/USDT',
  ]
  const exchanges = ['kraken', 'binance', 'bybit', 'okx', 'valr']
  
  React.useEffect(() => {
   

    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v1/crypto-data', {
          params: {
            pairs: cryptoPairs,
            exchanges: exchanges,
          },
        })
        // calculate price
        let _data = response.data.map((item: CryptoDataClient) => {
          const price: number = (item.ask ?? 0)

          return {
            ...item,
            price,
          }
        })

        //get lowest price

        let lowestPrices = getLowestPrices(_data)

        // insert price changes
        _data = _data.map((item: CryptoDataClient) => {
          const priceChange: number =
            ((item.price - lowestPrices[item.symbol]) /
              lowestPrices[item.symbol]) 

          return {
            ...item,
            priceChange,
          }
        })

        setData(_data)
      } catch (error) {
        console.error('Error fetching data: ', error)
        // Handle error appropriately in your actual application
      }
    }

    fetchData()
  }, [])

  return (
    <div className='w-full'>
      <div className='flex items-center py-4'>
        <Input
          placeholder='Filter symbol...'
          value={(table.getColumn('symbol')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>{
            table.getColumn('symbol')?.setFilterValue(event.target.value)
          }
        
          }
          className='max-w-sm'
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='ml-auto'>
              Columns <ChevronDown className='ml-2 h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  <div className='flex '>
                    <div className='mx-auto flex flex-nowrap'>
                      <Loader2 className='h-4 w-4 m-1 animate-spin'> </Loader2>
                      Please wait ...
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
