import React, { memo, useCallback } from 'react';
import { List, AutoSizer, ListRowProps } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface VirtualizedExamListProps {
  examenes: string[];
  onRemove: (index: number) => void;
  getExamenInfo: (codigo: string) => { codigo: string; nombre: string } | undefined;
  containerHeight?: number;
}



const VirtualizedExamList: React.FC<VirtualizedExamListProps> = memo(({
  examenes,
  onRemove,
  getExamenInfo,
  containerHeight = 300
}) => {
  // Row renderer for virtualized list
  const rowRenderer = useCallback(({ index, key, style }: ListRowProps) => {
    const examen = examenes[index];
    const examenInfo = getExamenInfo(examen);
    
    const handleRemove = () => {
      onRemove(index);
    };

    return (
      <div key={key} style={style} className="px-2">
        <div className="flex items-center justify-between p-3 bg-[#f6eedb] rounded border border-[#d5c7aa] mx-1 my-1">
          <div className="flex-1">
            <div className="font-medium text-[#68563c]">{examen}</div>
            {examenInfo && (
              <div className="text-sm text-[#8e9b6d]">{examenInfo.nombre}</div>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            title="Eliminar examen"
          >
            ×
          </button>
        </div>
      </div>
    );
  }, [examenes, onRemove, getExamenInfo]);

  // Only virtualize if list is large enough
  if (examenes.length <= 20) {
    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {examenes.map((examen, index) => {
          const examenInfo = getExamenInfo(examen);
          return (
            <div
              key={`${examen}-${index}`}
              className="flex items-center justify-between p-3 bg-[#f6eedb] rounded border border-[#d5c7aa]"
            >
              <div className="flex-1">
                <div className="font-medium text-[#68563c]">{examen}</div>
                {examenInfo && (
                  <div className="text-sm text-[#8e9b6d]">{examenInfo.nombre}</div>
                )}
              </div>
              <button
                onClick={() => onRemove(index)}
                className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                title="Eliminar examen"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  // Virtualized list for >20 items
  return (
    <div className="border border-[#d5c7aa] rounded" style={{ height: containerHeight }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            rowCount={examenes.length}
            rowHeight={80}
            rowRenderer={rowRenderer}
            className="scrollbar-thin scrollbar-thumb-[#d5c7aa] scrollbar-track-transparent"
          />
        )}
      </AutoSizer>
    </div>
  );
});

VirtualizedExamList.displayName = 'VirtualizedExamList';

export default VirtualizedExamList;