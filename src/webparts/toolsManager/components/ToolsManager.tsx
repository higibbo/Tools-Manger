import React, { useState, useCallback } from 'react';
import {
  Stack,
  SearchBox,
  Text,
  IconButton,
  IIconProps,
  DetailsList,
  IColumn,
  SelectionMode,
  IObjectWithKey,
//  DragDropHelper,
  getTheme,
  mergeStyleSets,
 // ICommandBarItemProps
} from '@fluentui/react';
import { IToolsManagerProps } from './IToolsManagerProps';

interface ITool extends IObjectWithKey {
  id: string;
  title: string;
  icon: string;
  url: string;
}

// Icon definitions
const moveUpIcon: IIconProps = { iconName: 'ChevronUp' };
const moveDownIcon: IIconProps = { iconName: 'ChevronDown' };
const removeIcon: IIconProps = { iconName: 'Cancel' };
const addIcon: IIconProps = { iconName: 'Add' };

// Styles
const theme = getTheme();
const classNames = mergeStyleSets({
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: theme.palette.white,
    boxShadow: theme.effects.elevation4,
    borderRadius: '2px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  section: {
    marginBottom: '20px',
  },
  toolItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    border: `1px solid ${theme.palette.neutralLight}`,
    marginBottom: '8px',
    borderRadius: '4px',
    backgroundColor: theme.palette.white,
    '&:hover': {
      backgroundColor: theme.palette.neutralLighter,
    },
  },
  iconButtons: {
    display: 'flex',
    gap: '4px',
  },
});

const ToolsManager: React.FC<IToolsManagerProps> = (props) => {
  const [selectedTools, setSelectedTools] = useState<ITool[]>([
    { id: '1', title: 'Workday', icon: props.context.pageContext.web.absoluteUrl + '/_layouts/15/images/placeholder.png', url: '#' },
    { id: '2', title: 'Time Mgr', icon: props.context.pageContext.web.absoluteUrl + '/_layouts/15/images/placeholder.png', url: '#' },
    { id: '3', title: 'Fidelity', icon: props.context.pageContext.web.absoluteUrl + '/_layouts/15/images/placeholder.png', url: '#' }
  ]);
  
  const [availableTools] = useState<ITool[]>([
    { id: '4', title: 'ATLAS Effects', icon: props.context.pageContext.web.absoluteUrl + '/_layouts/15/images/placeholder.png', url: '#' },
    { id: '5', title: 'Browse Learning', icon: props.context.pageContext.web.absoluteUrl + '/_layouts/15/images/placeholder.png', url: '#' },
    { id: '6', title: 'Business Cards', icon: props.context.pageContext.web.absoluteUrl + '/_layouts/15/images/placeholder.png', url: '#' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Column definitions for selected tools
  const selectedColumns: IColumn[] = [
    {
      key: 'title',
      name: 'Tool',
      fieldName: 'title',
      minWidth: 100,
      maxWidth: 200,
      onRender: (item: ITool) => (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <img src={item.icon} alt="" width={24} height={24} />
          <Text>{item.title}</Text>
        </Stack>
      ),
    },
    {
      key: 'actions',
      name: 'Actions',
      minWidth: 100,
      maxWidth: 150,
      onRender: (item: ITool, index: number) => (
        <Stack horizontal tokens={{ childrenGap: 4 }}>
          <IconButton
            iconProps={moveUpIcon}
            title="Move Up"
            disabled={index === 0}
            onClick={() => moveItem(index, index - 1)}
          />
          <IconButton
            iconProps={moveDownIcon}
            title="Move Down"
            disabled={index === selectedTools.length - 1}
            onClick={() => moveItem(index, index + 1)}
          />
          <IconButton
            iconProps={removeIcon}
            title="Remove"
            onClick={() => removeTool(item.id)}
          />
        </Stack>
      ),
    },
  ];

  // Column definitions for available tools
  const availableColumns: IColumn[] = [
    {
      key: 'title',
      name: 'Tool',
      fieldName: 'title',
      minWidth: 100,
      maxWidth: 200,
      onRender: (item: ITool) => (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <img src={item.icon} alt="" width={24} height={24} />
          <Text>{item.title}</Text>
        </Stack>
      ),
    },
    {
      key: 'actions',
      name: 'Actions',
      minWidth: 100,
      maxWidth: 150,
      onRender: (item: ITool) => (
        <IconButton
          iconProps={addIcon}
          title="Add"
          onClick={() => addTool(item)}
          disabled={selectedTools.some(t => t.id === item.id)}
        />
      ),
    },
  ];

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= selectedTools.length) return;
    
    const newTools = [...selectedTools];
    const [movedItem] = newTools.splice(fromIndex, 1);
    newTools.splice(toIndex, 0, movedItem);
    setSelectedTools(newTools);
  }, [selectedTools]);

  const addTool = (tool: ITool) => {
    if (!selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const removeTool = (toolId: string) => {
    setSelectedTools(selectedTools.filter(tool => tool.id !== toolId));
  };

  const filteredAvailableTools = availableTools.filter(
    tool => tool.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={classNames.container}>
      <Stack tokens={{ childrenGap: 20 }}>
        <div className={classNames.header}>
          <Text variant="xLarge">{props.title || "My Tools & Apps"}</Text>
          <SearchBox
            placeholder="Search Tools & Apps"
            onChange={(_, newValue) => setSearchTerm(newValue || '')}
            styles={{ root: { width: 200 } }}
          />
        </div>

        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack.Item grow={1}>
            <Text variant="large" block>Selected Tools</Text>
            <DetailsList
              items={selectedTools}
              columns={selectedColumns}
              selectionMode={SelectionMode.none}
              compact={true}
              isHeaderVisible={false}
            />
          </Stack.Item>

          <Stack.Item grow={1}>
            <Text variant="large" block>Available Tools</Text>
            <DetailsList
              items={filteredAvailableTools}
              columns={availableColumns}
              selectionMode={SelectionMode.none}
              compact={true}
              isHeaderVisible={false}
            />
          </Stack.Item>
        </Stack>
      </Stack>
    </div>
  );
};

export default ToolsManager;