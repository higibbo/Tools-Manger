import React, { useState, useCallback, useEffect } from 'react';
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
  getTheme,
  mergeStyleSets,
  IDragDropEvents,
  IDragDropContext
} from '@fluentui/react';
import { IToolsManagerProps } from './IToolsManagerProps';
import { SPFx, spfi as spfiFactory } from "@pnp/sp";
//import { IList, IListEnsureResult } from "@pnp/sp/lists";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
//import { SPFI, spfi as spfiFactory, SPFx } from "@pnp/sp";
import { MSGraphClientV3 } from '@microsoft/sp-http';

import "@pnp/graph/users";
import "@pnp/graph/files";

interface ITool extends IObjectWithKey {
  id: string;
  title: string;
  icon: string;
  url: string;
}

interface IToolListItem {
  Id: string;
  Title: string;
  IconUrl: string;
  ToolUrl: string;
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
  dragEnter: {
    backgroundColor: theme.palette.neutralLight,
    border: `1px dashed ${theme.palette.themePrimary}`
  },
  dragOver: {
    backgroundColor: theme.palette.neutralLighter,
    border: `1px dashed ${theme.palette.themePrimary}`
  }
});

const ToolsManager: React.FC<IToolsManagerProps> = (props) => {
  const [selectedTools, setSelectedTools] = useState<ITool[]>([]);
  
  const [availableTools, setAvailableTools] = useState<ITool[]>([]);

  // Add SP instance
  const sp = spfi(props);

  const FILE_NAME = 'selected-tools.json';
  const FILE_PATH = `/drive/special/approot:/${FILE_NAME}:/`;

  const handleToolsFile = async () => {
    try {
      const graphClient: MSGraphClientV3 = await props.context.msGraphClientFactory.getClient('3');
      
      // Try to read the file
      try {
        const response = await graphClient
          .api(FILE_PATH + 'content')
          .get();
        
        const tools = await response.json();
        setSelectedTools(tools);
      } catch (error) {
        // File doesn't exist, create it with default tools
        const defaultTools = [
          { id: '1', title: 'Workday', icon: props.context.pageContext.web.absoluteUrl + '/_layouts/15/images/placeholder.png', url: '#' },
          { id: '2', title: 'Time Mgr', icon: props.context.pageContext.web.absoluteUrl + '/_layouts/15/images/placeholder.png', url: '#' },
          { id: '3', title: 'Fidelity', icon: props.context.pageContext.web.absoluteUrl + '/_layouts/15/images/placeholder.png', url: '#' }
        ];

        await graphClient
          .api(FILE_PATH + 'content')
          .put(JSON.stringify(defaultTools));

        setSelectedTools(defaultTools);
      }
    } catch (error) {
      console.error('Error handling tools file:', error);
    }
  };

  const saveToolsToFile = async (tools: ITool[]) => {
    try {
      const graphClient: MSGraphClientV3 = await props.context.msGraphClientFactory.getClient('3');
      
      await graphClient
        .api(FILE_PATH + 'content')
        .put(JSON.stringify(tools));
    } catch (error) {
      console.error('Error saving tools:', error);
    }
  };

  // Add useEffect to fetch tools
  useEffect(() => {
    handleToolsFile();
  }, []); // Empty dependency array means this runs once when component mounts

  const [searchTerm, setSearchTerm] = useState('');

  // Column definitions for selected tools
  const selectedColumns: IColumn[] = [
    {
      key: 'title',
      name: 'Tool',
      fieldName: 'title',
      minWidth: 100,
      maxWidth: 200,
      isResizable: false,
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
    saveToolsToFile(newTools);
  }, [selectedTools]);

  const addTool = (tool: ITool) => {
    if (!selectedTools.find(t => t.id === tool.id)) {
      const newTools = [...selectedTools, tool];
      setSelectedTools(newTools);
      saveToolsToFile(newTools);
    }
  };

  const removeTool = (toolId: string) => {
    const newTools = selectedTools.filter(tool => tool.id !== toolId);
    setSelectedTools(newTools);
    saveToolsToFile(newTools);
  };

  const filteredAvailableTools = availableTools.filter(
    tool => tool.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dragDropEvents: IDragDropEvents = {
    canDrop: (dropContext?: IDragDropContext) => true,
    canDrag: (item?: any) => true,
    onDragStart: (item?: any, itemIndex?: number) => {
      return undefined;
    },
    onDrop: (item?: any, event?: DragEvent) => {
      if (item && event) {
        const draggedItemIndex = selectedTools.findIndex(tool => tool.id === item.id);
        const dropLocation = event.currentTarget as HTMLElement;
        const dropIndex = parseInt(dropLocation.getAttribute('data-index') || '0', 10);

        if (draggedItemIndex !== dropIndex) {
          const newTools = [...selectedTools];
          const [draggedItem] = newTools.splice(draggedItemIndex, 1);
          newTools.splice(dropIndex, 0, draggedItem);
          setSelectedTools(newTools);
        }
      }
    }
  };

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
              dragDropEvents={dragDropEvents}
              setKey="set"
             
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
function spfi(props: IToolsManagerProps) {
  return spfiFactory().using(SPFx(props.context));
}
