"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PARSE_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ai_parsed", label: "AI Parsed" },
  { value: "ai_parsed_failed", label: "AI Parse Failed" },
  { value: "human_parsed_once_success", label: "Human Parsed (Once)" },
  { value: "human_parsed_unclear", label: "Human Parsed (Unclear)" },
  { value: "human_parsed_twice_success", label: "Human Parsed (Twice)" },
  { value: "null", label: "Not Parsed" },
  { value: "no_parse_needed", label: "No Parse Needed" },
];

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ai_parsed":
    case "human_parsed_once_success":
    case "human_parsed_twice_success":
      return "default";
    case "ai_parsed_failed":
      return "destructive";
    case "human_parsed_unclear":
      return "secondary";
    case "no_parse_needed":
    default:
      return "outline";
  }
}

export function SearchAndFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "");

  // Update URL when search or filter changes
  const updateURL = (search: string, status: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    // Keep page parameter if it exists and is not 1
    const currentPage = searchParams.get("page");
    if (currentPage && currentPage !== "1" && (!search && !status)) {
      params.set("page", currentPage);
    }
    
    const queryString = params.toString();
    router.push(`/courses${queryString ? `?${queryString}` : ""}`);
  };

  const handleSearch = () => {
    updateURL(searchTerm, selectedStatus);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const hasActiveFilters = searchTerm || selectedStatus;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses by department, number, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="sm:w-64">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {PARSE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Active Filters Display - Always shown to prevent layout shift */}
      {/* <div className="flex flex-wrap gap-2 items-center min-h-[2rem]">
        {hasActiveFilters ? (
          <>
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary">
                Search: &ldquo;{searchTerm}&rdquo;
              </Badge>
            )}
            {selectedStatus && (
              <Badge variant={getStatusBadgeVariant(selectedStatus)}>
                Status: {PARSE_STATUS_OPTIONS.find(opt => opt.value === selectedStatus)?.label}
              </Badge>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground opacity-0">No active filters</span>
        )}
      </div> */}
    </div>
  );
}