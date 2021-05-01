import { useMemo } from "react";
import { useQuery, useQueries } from "react-query";

import { useRari } from "../context/RariContext";
import { fetchFusePoolData, FusePoolData } from "../utils/fetchFusePoolData";

export const useFusePoolData = (poolId: string): FusePoolData | undefined => {
  const { fuse, rari, address } = useRari();

  const { data } = useQuery(poolId + " poolData " + address, () => {
    return fetchFusePoolData(poolId, address, fuse, rari);
  });

  return data;
};

// Fetch APYs for all pools
export const useFusePoolsData = (poolIds: number[]): FusePoolData[] | null => {
  const { fuse, rari, address } = useRari();

  const poolsData = useQueries(
    poolIds.map((id: number) => {
      return {
        queryKey: id + " apy",
        queryFn: () => {
          return fetchFusePoolData(id.toString(), address, fuse, rari);
        },
      };
    })
  );

  return useMemo(() => {
    // todo - use type FusePoolData
    const ret: any[] = [];

    if (!poolsData.length) return null;

    // Return null altogether
    poolsData.forEach(({ data }) => {
      if (!data) return null;
      ret.push(data);
    });

    if (!ret.length) return null;

    return ret;
  }, [poolsData]);
};
