import { useState } from "react";
import { Table } from "@tanstack/react-table";
import { X, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { LoadingSpinner } from "@/components/feedback/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { productScraperService } from "@/services/product-scraper";

import { Product } from "./columns";

interface DataTableToolbarProps {
  table: Table<Product>;
  onRefresh?: () => Promise<void>;
}

export function DataTableToolbar({ table, onRefresh }: DataTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  const selectedRows = table.getSelectedRowModel().rows;
  
  const handleBulkRefresh = async () => {
    try {
      setIsRefreshing(true);
      const asins = selectedRows.map(row => row.original.asin);
      await productScraperService.startScraping(asins);
      toast({
        title: "Refresh Started",
        description: `Started refreshing ${asins.length} products.`,
      });
      if (onRefresh) {
        await onRefresh();
      }
      table.toggleAllRowsSelected(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh products",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter products..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {selectedRows.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            {isRefreshing ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Selected ({selectedRows.length})
          </Button>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}