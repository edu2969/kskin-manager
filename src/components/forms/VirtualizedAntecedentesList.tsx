import React, { memo, useCallback } from 'react';
import { List, AutoSizer, ListRowProps } from 'react-virtualized';
import { AntecedenteMorbido } from '../../types';
import 'react-virtualized/styles.css';

interface VirtualizedAntecedentesListProps {
  antecedentes: AntecedenteMorbido[];
  onToggle: (index: number, checked: boolean) => void;
  saving: boolean;
  containerHeight?: number;
}

const VirtualizedAntecedentesList: React.FC<VirtualizedAntecedentesListProps> = memo(({
  antecedentes,
  onToggle,
  saving,
  containerHeight = 300
}) => {
  // Row renderer for virtualized list
  const rowRenderer = useCallback(({ index, key, style }: ListRowProps) => {
    const antecedente = antecedentes[index];
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onToggle(index, e.target.checked);
    };

    return (
      <div key={key} style={style} className="px-2">
        <label className="flex items-center gap-2 p-2 hover:bg-[#f6eedb] rounded cursor-pointer h-full">
          <input
            type="checkbox"
            checked={antecedente.checked}
            onChange={handleChange}
            className="text-[#ac9164] focus:ring-[#ac9164] focus:ring-2"
            disabled={saving}
          />
          <span className="text-sm text-[#68563c] flex-1 leading-tight">
            {antecedente.glosa}
          </span>
        </label>
      </div>
    );
  }, [antecedentes, onToggle, saving]);

  // Only virtualize if list is large enough
  if (antecedentes.length <= 250) {
    return (
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {antecedentes.map((antecedente, index) => (
          <label 
            key={antecedente._id} 
            className="flex items-center gap-2 p-2 hover:bg-[#f6eedb] rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={antecedente.checked}
              onChange={(e) => onToggle(index, e.target.checked)}
              className="text-[#ac9164] focus:ring-[#ac9164] focus:ring-2"
              disabled={saving}
            />
            <span className="text-sm text-[#68563c] flex-1">
              {antecedente.glosa}
            </span>
          </label>
        ))}
      </div>
    );
  }

  // Virtualized list for >250 items
  return (
    <div className="border border-[#d5c7aa] rounded" style={{ height: containerHeight }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            rowCount={antecedentes.length}
            rowHeight={44}
            rowRenderer={rowRenderer}
            className="scrollbar-thin scrollbar-thumb-[#d5c7aa] scrollbar-track-transparent"
          />
        )}
      </AutoSizer>
    </div>
  );
});

VirtualizedAntecedentesList.displayName = 'VirtualizedAntecedentesList';

export default VirtualizedAntecedentesList;