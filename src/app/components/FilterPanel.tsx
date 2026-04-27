import { useState, useMemo } from 'react';

interface Visit {
  id: string;
  title: string;
  customer: string;
  date: Date;
  productLine: string;
  location: string;
  arr: number;
  salesRep: string;
  domain: string;
  isDraft?: boolean;
}

interface FilterPanelProps {
  visits: Visit[];
}

export default function FilterPanel({ visits }: FilterPanelProps) {
  const [filters, setFilters] = useState({
    productLines: [] as string[],
    location: '',
    arrMin: '',
    arrMax: '',
    salesRep: '',
    domain: '',
    customer: '',
    keyAccounts: false,
  });

  // Extract unique values from existing visits
  const productLineOptions = useMemo(() =>
    [...new Set(visits.map(v => v.productLine))].sort(),
    [visits]
  );

  const domainOptions = useMemo(() =>
    [...new Set(visits.map(v => v.domain).filter(Boolean))].sort(),
    [visits]
  );

  const locationOptions = useMemo(() =>
    [...new Set(visits.map(v => v.location).filter(Boolean))].sort(),
    [visits]
  );

  const salesRepOptions = useMemo(() =>
    [...new Set(visits.map(v => v.salesRep).filter(Boolean))].sort(),
    [visits]
  );

  const handleProductLineToggle = (line: string) => {
    setFilters(prev => ({
      ...prev,
      productLines: prev.productLines.includes(line)
        ? prev.productLines.filter(l => l !== line)
        : [...prev.productLines, line],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block mb-2">Product Line</label>
          <div className="space-y-2 max-h-48 overflow-auto">
            {productLineOptions.length > 0 ? (
              productLineOptions.map(line => (
                <label key={line} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.productLines.includes(line)}
                    onChange={() => handleProductLineToggle(line)}
                    className="rounded"
                  />
                  {line}
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-400">No product lines available</p>
            )}
          </div>
        </div>

        <div>
          <label className="block mb-2">Location</label>
          <select
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">All Locations</option>
            {locationOptions.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>

          <label className="block mb-2 mt-4">Domain</label>
          <select
            value={filters.domain}
            onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">All Domains</option>
            {domainOptions.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2">ARR Range</label>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.arrMin}
              onChange={(e) => setFilters({ ...filters, arrMin: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.arrMax}
              onChange={(e) => setFilters({ ...filters, arrMax: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block mb-2">Sales Rep</label>
          <select
            value={filters.salesRep}
            onChange={(e) => setFilters({ ...filters, salesRep: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">All Sales Reps</option>
            {salesRepOptions.map(rep => (
              <option key={rep} value={rep}>{rep}</option>
            ))}
          </select>

          <label className="block mb-2 mt-4">Customer</label>
          <input
            type="text"
            placeholder="Search customer"
            value={filters.customer}
            onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />

          <label className="flex items-center gap-2 mt-4 text-sm">
            <input
              type="checkbox"
              checked={filters.keyAccounts}
              onChange={(e) => setFilters({ ...filters, keyAccounts: e.target.checked })}
              className="rounded"
            />
            Key Accounts Only
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <button
          onClick={() => setFilters({
            productLines: [],
            location: '',
            arrMin: '',
            arrMax: '',
            salesRep: '',
            domain: '',
            customer: '',
            keyAccounts: false,
          })}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Clear Filters
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Apply Filters
        </button>
      </div>
    </div>
  );
}
