import { useNavigate } from "react-router-dom";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pen, Trash, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/feedback/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { productScraperService } from "@/services/product-scraper";
import { Product } from "./columns";

interface DataTableRowActionsProps {
  row: Row<Product>;
  onRefresh?: () => Promise<void>;
}

export function DataTableRowActions({ row, onRefresh }: DataTableRowActionsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await productScraperService.startScraping([row.original.asin]);
      toast({
        title: "Refresh Started",
        description: "Product data refresh has been initiated.",
      });
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => navigate(`/reviews/${row.original.id}`)}>
          <Pen className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh Data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <Trash className="mr-2 h-4 w-4" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}