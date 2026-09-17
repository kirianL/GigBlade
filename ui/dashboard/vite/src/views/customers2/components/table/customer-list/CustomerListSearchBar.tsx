import { Input } from "@autumn/ui";
import { ListMagnifyingGlassIcon } from "@phosphor-icons/react";
import { debounce } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCustomerFilters } from "@/views/customers/hooks/useCustomerFilters";

export function CustomerListSearchBar() {
	const { queryStates, setFilters } = useCustomerFilters();

	const setFiltersRef = useRef(setFilters);
	useEffect(() => {
		setFiltersRef.current = setFilters;
	});

	const lastPushedRef = useRef(queryStates.q);

	const debouncedSearch = useMemo(
		() =>
			debounce((query: string) => {
				lastPushedRef.current = query;
				setFiltersRef.current({ q: query });
			}, 350),
		[],
	);

	useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

	const [localQuery, setLocalQuery] = useState(queryStates.q);

	// When the URL value changes from something other than our own debounce
	// (e.g. saved view applied, filter restore), sync the input to match.
	useEffect(() => {
		if (queryStates.q === lastPushedRef.current) return;
		lastPushedRef.current = queryStates.q;
		setLocalQuery(queryStates.q);
		debouncedSearch.cancel();
	}, [queryStates.q, debouncedSearch]);

	return (
		<div className="relative flex items-center flex-1 min-w-0">
			<ListMagnifyingGlassIcon
				size={16}
				className="text-tertiary-foreground absolute left-2.5 pointer-events-none"
			/>
			<Input
				value={localQuery}
				onChange={(e) => {
					const raw = e.target.value;
					setLocalQuery(raw);
					debouncedSearch(raw.trim());
				}}
				className="pl-8! text-sm w-full"
				placeholder="Buscar DJs"
			/>
		</div>
	);
}
