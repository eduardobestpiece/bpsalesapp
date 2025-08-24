[plugin:vite:react-swc] × the name `handleEditPermission` is defined multiple times
     ╭─[/Users/eduardocosta/Downloads/Projeto Monteo/src/pages/settings/SettingsMaster.tsx:418:1]
 415 │     }
 416 │   };
 417 │ 
 418 │   const handleEditPermission = (permission: any) => {
     ·         ──────────┬─────────
     ·                   ╰── previous definition of `handleEditPermission` here
 419 │     setSelectedPermission(permission);
 420 │     setPermissionName(permission.name);
 421 │     setPermissionLevel(permission.level);
 422 │     setPermissionDetails(permission.details || []);
 423 │     setShowPermissionModal(true);
 424 │   };
 425 │ 
 426 │   const handleTogglePermissionStatus = async (permission: any) => {
 427 │     const newStatus = permission.status === 'active' ? 'inactive' : 'active';
 428 │     
 429 │     // Por enquanto, apenas simular a atualização
 430 │     console.log('Alterando status da permissão:', { permission, newStatus });
 431 │     
 432 │     // Em uma implementação futura, isso seria uma mutation
 433 │     toast.success(`Permissão ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso!`);
 434 │   };
 435 │ 
 436 │   const resetPermissionForm = () => {
 437 │     setPermissionName('');
 438 │     setPermissionLevel('');
 439 │     setPermissionDetails([]);
 440 │     setSelectedPermission(null);
 441 │   };
 442 │ 
 443 │   const handleCreatePermission = async (e: React.FormEvent) => {
 444 │     e.preventDefault();
 445 │     
 446 │     if (!permissionName || !permissionLevel) {
 447 │       toast.error('Por favor, preencha todos os campos obrigatórios');
 448 │       return;
 449 │     }
 450 │ 
 451 │     setIsCreatingPermission(true);
 452 │     
 453 │     try {
 454 │       // Por enquanto, apenas simular a criação
 455 │       console.log('Criando/Editando permissão:', {
 456 │         name: permissionName,
 457 │         level: permissionLevel,
 458 │         details: permissionDetails
 459 │       });
 460 │       
 461 │       // Em uma implementação futura, isso seria uma mutation
 462 │       await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
 463 │       
 464 │       toast.success(selectedPermission ? 'Permissão atualizada com sucesso!' : 'Permissão criada com sucesso!');
 465 │       setShowPermissionModal(false);
 466 │       resetPermissionForm();
 467 │       
 468 │       // Invalidar queries para atualizar a lista
 469 │       queryClient.invalidateQueries({ queryKey: ['permissions', 'master'] });
 470 │     } catch (error) {
 471 │       console.error('Erro ao criar/editar permissão:', error);
 472 │       toast.error('Erro ao salvar permissão');
 473 │     } finally {
 474 │       setIsCreatingPermission(false);
 475 │     }
 476 │   };
 477 │ 
 478 │   const handleTogglePermission = async (permission: any, role: string) => {
 479 │     console.log('handleTogglePermission chamado:', { permission, role });
 480 │     const currentAllowed = permission[`${role}_allowed`];
 481 │     const newAllowed = !currentAllowed;
 482 │     
 483 │     console.log('Valores:', { currentAllowed, newAllowed, page: permission.page });
 484 │     
 485 │     try {
 486 │       // Buscar todas as páginas que pertencem à mesma aba
 487 │       const pageInfo = getPageInfo(permission.page);
 488 │       if (!pageInfo) {
 489 │         console.error('PageInfo não encontrado para:', permission.page);
 490 │         return;
 491 │       }
 492 │       
 493 │       // Buscar todas as permissões originais que pertencem à mesma aba
 494 │       const { data: allPermissions } = await supabase
 495 │         .from('role_page_permissions')
 496 │         .select('*')
 497 │         .eq('role', role)
 498 │         .eq('company_id', companyId);
 499 │       
 500 │       if (!allPermissions) {
 501 │         console.error('Nenhuma permissão encontrada');
 502 │         return;
 503 │       }
 504 │       
 505 │       // Filtrar permissões que pertencem à mesma aba
 506 │       const relatedPermissions = allPermissions.filter(p => {
 507 │         const pInfo = getPageInfo(p.page);
 508 │         return pInfo && pInfo.module === pageInfo.module && pInfo.tab === pageInfo.tab;
 509 │       });
 510 │       
 511 │       console.log('Permissões relacionadas encontradas:', relatedPermissions);
 512 │       
 513 │       // Atualizar todas as permissões relacionadas
 514 │       for (const perm of relatedPermissions) {
 515 │         await togglePermissionMutation.mutateAsync({
 516 │           page: perm.page,
 517 │           role,
 518 │           allowed: newAllowed
 519 │         });
 520 │       }
 521 │       
 522 │       console.log('Todas as permissões relacionadas atualizadas');
 523 │     } catch (error) {
 524 │       console.error('Erro na mutation:', error);
 525 │     }
 526 │   };
 527 │ 
 528 │   // Função para mapear páginas para módulos e abas
 529 │   const getPageInfo = (page: string) => {
 530 │     const pageMappings: { [key: string]: { module: string; tab: string; pageName: string; description: string } } = {
 531 │       // Módulo de Configurações - Gestão
 532 │       'settings_profile_info': { 
 533 │         module: 'Configurações', 
 534 │         tab: 'Meu Perfil', 
 535 │         pageName: 'Gestão',
 536 │         description: 'Pode ver e editar as informações do próprio perfil'
 537 │       },
 538 │       'settings_profile_integrations': { 
 539 │         module: 'Configurações', 
 540 │         tab: 'Meu Perfil', 
 541 │         pageName: 'Gestão',
 542 │         description: 'Pode ver e editar as informações do próprio perfil'
 543 │       },
 544 │       'settings_profile_security': { 
 545 │         module: 'Configurações', 
 546 │         tab: 'Meu Perfil', 
 547 │         pageName: 'Gestão',
 548 │         description: 'Pode ver e editar as informações do próprio perfil'
 549 │       },
 550 │       'settings_company_data': { 
 551 │         module: 'Configurações', 
 552 │         tab: 'Empresa', 
 553 │         pageName: 'Gestão',
 554 │         description: 'Pode ver e editar informações da própria empresa'
 555 │       },
 556 │       'settings_company_branding': { 
 557 │         module: 'Configurações', 
 558 │         tab: 'Empresa', 
 559 │         pageName: 'Gestão',
 560 │         description: 'Pode ver e editar informações da própria empresa'
 561 │       },
 562 │       'settings_users_list': { 
 563 │         module: 'Configurações', 
 564 │         tab: 'Usuários', 
 565 │         pageName: 'Gestão',
 566 │         description: 'Pode ver todos usuários, criar usuários, editá-los e desativar usuários. Usuário NÃO pode se desativar'
 567 │       },
 568 │       
 569 │       // Configurações CRM
 570 │       'crm_config_funnels': { 
 571 │         module: 'Configurações', 
 572 │         tab: 'Funis', 
 573 │         pageName: 'Configurações CRM',
 574 │         description: 'Pode criar, editar e arquivar Funis'
 575 │       },
 576 │       'crm_config_sources': { 
 577 │         module: 'Configurações', 
 578 │         tab: 'Origens', 
 579 │         pageName: 'Configurações CRM',
 580 │         description: 'Pode criar, editar e arquivar origens'
 581 │       },
 582 │       'crm_config_teams': { 
 583 │         module: 'Configurações', 
 584 │         tab: 'Times', 
 585 │         pageName: 'Configurações CRM',
 586 │         description: 'Pode criar, editar e arquivar Times'
 587 │       },
 588 │       'crm_config_users': { 
 589 │         module: 'Configurações', 
 590 │         tab: 'Usuários', 
 591 │         pageName: 'Configurações CRM',
 592 │         description: 'Gerenciar usuários do CRM'
 593 │       },
 594 │       
 595 │       // Configurações de Agendamento
 596 │       'settings_agendamento_availability': { 
 597 │         module: 'Configurações', 
 598 │         tab: 'Disponibilidade', 
 599 │         pageName: 'Configurações',
 600 │         description: 'Gerenciar disponibilidade para agendamentos'
 601 │       },
 602 │       'settings_agendamento_event_types': { 
 603 │         module: 'Configurações', 
 604 │         tab: 'Tipos de Evento', 
 605 │         pageName: 'Configurações',
 606 │         description: 'Gerenciar tipos de eventos'
 607 │       },
 608 │       'settings_agendamento_forms': { 
 609 │         module: 'Configurações', 
 610 │         tab: 'Formulários', 
 611 │         pageName: 'Configurações',
 612 │         description: 'Gerenciar formulários de agendamento'
 613 │       },
 614 │       'settings_agendamento_calendar': { 
 615 │         module: 'Configurações', 
 616 │         tab: 'Calendário', 
 617 │         pageName: 'Configurações',
 618 │         description: 'Configurar calendário de agendamentos'
 619 │       },
 620 │ 
 621 │       // Módulo do Simulador
 622 │       'simulator': { 
 623 │         module: 'Simulador', 
 624 │         tab: 'Simulador', 
 625 │         pageName: 'Simulador',
 626 │         description: 'Pode usar o simulador'
 627 │       },
 628 │       
 629 │       // Configurações do Simulador
 630 │       'simulator_config_administrators': { 
 631 │         module: 'Simulador', 
 632 │         tab: 'Administradoras', 
 633 │         pageName: 'Configurações do Simulador',
 634 │         description: 'Pode criar, editar e arquivar administradoras'
 635 │       },
 636 │       'simulator_config_reductions': { 
 637 │         module: 'Simulador', 
 638 │         tab: 'Redução de Parcela', 
 639 │         pageName: 'Configurações do Simulador',
 640 │         description: 'Pode criar, editar e arquivar Redução de Parcela'
 641 │       },
 642 │       'simulator_config_installments': { 
 643 │         module: 'Simulador', 
 644 │         tab: 'Parcelas', 
 645 │         pageName: 'Configurações do Simulador',
 646 │         description: 'Pode criar, editar e arquivar Parcelas'
 647 │       },
 648 │       'simulator_config_products': { 
 649 │         module: 'Simulador', 
 650 │         tab: 'Produtos', 
 651 │         pageName: 'Configurações do Simulador',
 652 │         description: 'Pode criar, editar e arquivar Produtos'
 653 │       },
 654 │       'simulator_config_leverages': { 
 655 │         module: 'Simulador', 
 656 │         tab: 'Alavancas', 
 657 │         pageName: 'Configurações do Simulador',
 658 │         description: 'Pode criar, editar e arquivar Alavancas'
 659 │       },
 660 │ 
 661 │       // Módulo CRM
 662 │       'indicadores': { 
 663 │         module: 'CRM', 
 664 │         tab: 'Performance', 
 665 │         pageName: 'Indicadores',
 666 │         description: 'Pode ver todos os indicadores, de todos os funis, de todas as equipes e de todos os usuários'
 667 │       },
 668 │       'indicadores_performance': { 
 669 │         module: 'CRM', 
 670 │         tab: 'Performance', 
 671 │         pageName: 'Indicadores',
 672 │         description: 'Pode ver todos os indicadores, de todos os funis, de todas as equipes e de todos os usuários'
 673 │       },
 674 │       'indicadores_registro': { 
 675 │         module: 'CRM', 
 676 │         tab: 'Registro de Indicadores', 
 677 │         pageName: 'Indicadores',
 678 │         description: 'Pode registrar indicadores somente para si, editar somente os próprios indicadores e pode ver os indicadores de todos os funis, de todos os times e de todos os usuários'
 679 │       },
 680 │       'reports': { 
 681 │         module: 'CRM', 
 682 │         tab: 'Registro de Indicadores', 
 683 │         pageName: 'Indicadores',
 684 │         description: 'Pode registrar indicadores somente para si, editar somente os próprios indicadores e pode ver os indicadores de todos os funis, de todos os times e de todos os usuários'
 685 │       },
 686 │       
 687 │       // Comercial
 688 │       'comercial': { 
 689 │         module: 'CRM', 
 690 │         tab: 'Leads', 
 691 │         pageName: 'Comercial',
 692 │         description: 'Pode ver todos os leads, criar leads para qualquer usuário, editar os leads de qualquer usuário e excluir leads de qualquer usuário'
 693 │       },
 694 │       'comercial_leads': { 
 695 │         module: 'CRM', 
 696 │         tab: 'Leads', 
 697 │         pageName: 'Comercial',
 698 │         description: 'Pode ver todos os leads, criar leads para qualquer usuário, editar os leads de qualquer usuário e excluir leads de qualquer usuário'
 699 │       },
 700 │       'comercial_sales': { 
 701 │         module: 'CRM', 
 702 │         tab: 'Vendas', 
 703 │         pageName: 'Comercial',
 704 │         description: 'Pode ver ver todos as vendas, registrar vendas para qualquer usuário, editar as vendas de qualquer usuário e excluir vendas de qualquer usuário'
 705 │       },
 706 │       
 707 │       // Outras páginas CRM
 708 │       'dashboard': { 
 709 │         module: 'CRM', 
 710 │         tab: 'Dashboard', 
 711 │         pageName: 'Dashboard',
 712 │         description: 'Acesso ao dashboard do CRM'
 713 │       },
 714 │       'agenda': { 
 715 │         module: 'CRM', 
 716 │         tab: 'Agenda', 
 717 │         pageName: 'Agenda',
 718 │         description: 'Gerenciar agenda'
 719 │       },
 720 │       'agenda_temp': { 
 721 │         module: 'CRM', 
 722 │         tab: 'Agenda', 
 723 │         pageName: 'Agenda',
 724 │         description: 'Gerenciar agenda'
 725 │       },
 726 │ 
 727 │       // CRM Master (removido - não deve aparecer nas permissões)
 728 │       'crm_master_accesses': { module: 'CRM Master', tab: 'Acessos', pageName: 'CRM Master', description: '' },
 729 │       'crm_master_archived': { module: 'CRM Master', tab: 'Arquivados', pageName: 'CRM Master', description: '' },
 730 │       'crm_master_companies': { module: 'CRM Master', tab: 'Empresas', pageName: 'CRM Master', description: '' }
 731 │     };
 732 │ 
 733 │     return pageMappings[page] || null; // Retorna null para páginas que não devem aparecer na tabela
 734 │   };
 735 │ 
 736 │   // Funções para obter opções dos filtros
 737 │   const getModuleOptions = () => {
 738 │     const modules = [...new Set(permissions.map(p => p.module))];
 739 │     return modules.map(module => ({
 740 │       label: module,
 741 │       value: module
 742 │     }));
 743 │   };
 744 │ 
 745 │   const getPageOptions = () => {
 746 │     // Mostrar todas as páginas disponíveis, independente dos módulos selecionados
 747 │     const pages = [...new Set(permissions.map(p => p.pageName))];
 748 │     return pages.map(page => ({
 749 │       label: page,
 750 │       value: page
 751 │     }));
 752 │   };
 753 │ 
 754 │   const getTabOptions = () => {
 755 │     // Mostrar todas as abas disponíveis, independente dos módulos e páginas selecionados
 756 │     const tabs = [...new Set(permissions.map(p => p.tab))];
 757 │     return tabs.map(tab => ({
 758 │       label: tab,
 759 │       value: tab
 760 │     }));
 761 │   };
 762 │ 
 763 │   // Filtros
 764 │   const filteredCompanies = companies.filter(company =>
 765 │     company.name?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
 766 │     company.cnpj?.includes(companySearchTerm) ||
 767 │     company.niche?.toLowerCase().includes(companySearchTerm.toLowerCase())
 768 │   );
 769 │ 
 770 │   const filteredPermissions = permissions.filter(permission => {
 771 │     // Filtro por módulo - se nenhum módulo estiver selecionado, mostrar todos
 772 │     if (selectedModules.length > 0 && !selectedModules.includes(permission.module)) {
 773 │       return false;
 774 │     }
 775 │     
 776 │     // Filtro por página - se nenhuma página estiver selecionada, mostrar todas
 777 │     if (selectedPages.length > 0 && !selectedPages.includes(permission.pageName)) {
 778 │       return false;
 779 │     }
 780 │     
 781 │     // Filtro por aba - se nenhuma aba estiver selecionada, mostrar todas
 782 │     if (selectedTabs.length > 0 && !selectedTabs.includes(permission.tab)) {
 783 │       return false;
 784 │     }
 785 │     
 786 │     // Filtro por situação
 787 │     if (selectedStatus !== 'all') {
 788 │       const isActive = isPageActive(permission.page);
 789 │       if (selectedStatus === 'active' && !isActive) {
 790 │         return false;
 791 │       }
 792 │       if (selectedStatus === 'inactive' && isActive) {
 793 │         return false;
 794 │       }
 795 │     }
 796 │     
 797 │     // Filtro por texto (busca)
 798 │     if (permissionSearchTerm) {
 799 │       const searchTerm = permissionSearchTerm.toLowerCase();
 800 │       return (
 801 │         permission.page?.toLowerCase().includes(searchTerm) ||
 802 │         permission.pageName?.toLowerCase().includes(searchTerm) ||
 803 │         permission.tab?.toLowerCase().includes(searchTerm) ||
 804 │         permission.module?.toLowerCase().includes(searchTerm)
 805 │       );
 806 │     }
 807 │     
 808 │     return true;
 809 │   });
 810 │ 
 811 │   // Verificar permissões
 812 │   const canManageCompanies = userRole === 'master';
 813 │   const canManagePermissions = userRole === 'master';
 814 │ 
 815 │   const allowedOrder: { key: string; allowed: boolean }[] = [
 816 │     { key: 'companies', allowed: canManageCompanies },
 817 │     { key: 'permissions', allowed: canManagePermissions },
 818 │   ];
 819 │   const firstAllowed = allowedOrder.find(i => i.allowed)?.key;
 820 │   const [tabValue, setTabValue] = useState<string>(firstAllowed || 'companies');
 821 │   
 822 │   useEffect(() => {
 823 │     const next = allowedOrder.find(i => i.allowed)?.key || 'companies';
 824 │     if (!allowedOrder.find(i => i.key === tabValue && i.allowed)) {
 825 │       setTabValue(next);
 826 │     }
 827 │   }, [canManageCompanies, canManagePermissions, tabValue]);
 828 │ 
 829 │   // Verificar acesso
 830 │   if (userRole !== 'master') {
 831 │     return (
 832 │         <div className="min-h-[400px] flex items-center justify-center">
 833 │           <div className="text-center">
 834 │             <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
 835 │           <p className="text-muted-foreground">Apenas usuários Master podem acessar esta página.</p>
 836 │         </div>
 837 │       </div>
 838 │     );
 839 │   }
 840 │ 
 841 │   // Funções para limpar filtros dependentes
 842 │   const handleModuleChange = (modules: string[]) => {
 843 │     setSelectedModules(modules);
 844 │     // Não limpar filtros dependentes - filtros funcionam independentemente
 845 │   };
 846 │ 
 847 │   const handlePageChange = (pages: string[]) => {
 848 │     setSelectedPages(pages);
 849 │     // Não limpar filtros dependentes - filtros funcionam independentemente
 850 │   };
 851 │ 
 852 │   const handleTabChange = (tabs: string[]) => {
 853 │     setSelectedTabs(tabs);
 854 │   };
 855 │ 
 856 │   const clearAllFilters = () => {
 857 │     setSelectedModules([]);
 858 │     setSelectedPages([]);
 859 │     setSelectedTabs([]);
 860 │     setSelectedStatus('active'); // Voltar para o padrão
 861 │     setPermissionSearchTerm('');
 862 │   };
 863 │ 
 864 │   // Função para alternar status da página
 865 │   const handleTogglePageStatus = (page: string) => {
 866 │     const currentStatus = isPageActive(page);
 867 │     const newStatus = currentStatus ? 'inactive' : 'active';
 868 │     
 869 │     togglePageStatusMutation.mutateAsync({ page, status: newStatus });
 870 │   };
 871 │ 
 872 │   const handleStartEditDescription = (permission: any) => {
 873 │     setEditingDescription(permission.id);
 874 │     setEditingDescriptionValue(permission.description || '');
 875 │   };
 876 │ 
 877 │   const handleSaveDescription = async (permission: any) => {
 878 │     if (editingDescriptionValue.trim() === '') {
 879 │       toast.error('Descrição não pode estar vazia');
 880 │       return;
 881 │     }
 882 │     
 883 │     await updateDescriptionMutation.mutateAsync({
 884 │       page: permission.page,
 885 │       description: editingDescriptionValue.trim()
 886 │     });
 887 │   };
 888 │ 
 889 │   const handleCancelEditDescription = () => {
 890 │     setEditingDescription(null);
 891 │     setEditingDescriptionValue('');
 892 │   };
 893 │ 
 894 │   const handleEditPermission = (permission: any) => {
     ·         ──────────┬─────────
     ·                   ╰── `handleEditPermission` redefined here
 895 │     setSelectedPermission(permission);
 896 │     setPermissionName(permission.name);
 897 │     setPermissionLevel(permission.level);
     ╰────
  × the name `handleTogglePermissionStatus` is defined multiple times
     ╭─[/Users/eduardocosta/Downloads/Projeto Monteo/src/pages/settings/SettingsMaster.tsx:426:1]
 423 │     setShowPermissionModal(true);
 424 │   };
 425 │ 
 426 │   const handleTogglePermissionStatus = async (permission: any) => {
     ·         ──────────────┬─────────────
     ·                       ╰── previous definition of `handleTogglePermissionStatus` here
 427 │     const newStatus = permission.status === 'active' ? 'inactive' : 'active';
 428 │     
 429 │     // Por enquanto, apenas simular a atualização
 430 │     console.log('Alterando status da permissão:', { permission, newStatus });
 431 │     
 432 │     // Em uma implementação futura, isso seria uma mutation
 433 │     toast.success(`Permissão ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso!`);
 434 │   };
 435 │ 
 436 │   const resetPermissionForm = () => {
 437 │     setPermissionName('');
 438 │     setPermissionLevel('');
 439 │     setPermissionDetails([]);
 440 │     setSelectedPermission(null);
 441 │   };
 442 │ 
 443 │   const handleCreatePermission = async (e: React.FormEvent) => {
 444 │     e.preventDefault();
 445 │     
 446 │     if (!permissionName || !permissionLevel) {
 447 │       toast.error('Por favor, preencha todos os campos obrigatórios');
 448 │       return;
 449 │     }
 450 │ 
 451 │     setIsCreatingPermission(true);
 452 │     
 453 │     try {
 454 │       // Por enquanto, apenas simular a criação
 455 │       console.log('Criando/Editando permissão:', {
 456 │         name: permissionName,
 457 │         level: permissionLevel,
 458 │         details: permissionDetails
 459 │       });
 460 │       
 461 │       // Em uma implementação futura, isso seria uma mutation
 462 │       await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
 463 │       
 464 │       toast.success(selectedPermission ? 'Permissão atualizada com sucesso!' : 'Permissão criada com sucesso!');
 465 │       setShowPermissionModal(false);
 466 │       resetPermissionForm();
 467 │       
 468 │       // Invalidar queries para atualizar a lista
 469 │       queryClient.invalidateQueries({ queryKey: ['permissions', 'master'] });
 470 │     } catch (error) {
 471 │       console.error('Erro ao criar/editar permissão:', error);
 472 │       toast.error('Erro ao salvar permissão');
 473 │     } finally {
 474 │       setIsCreatingPermission(false);
 475 │     }
 476 │   };
 477 │ 
 478 │   const handleTogglePermission = async (permission: any, role: string) => {
 479 │     console.log('handleTogglePermission chamado:', { permission, role });
 480 │     const currentAllowed = permission[`${role}_allowed`];
 481 │     const newAllowed = !currentAllowed;
 482 │     
 483 │     console.log('Valores:', { currentAllowed, newAllowed, page: permission.page });
 484 │     
 485 │     try {
 486 │       // Buscar todas as páginas que pertencem à mesma aba
 487 │       const pageInfo = getPageInfo(permission.page);
 488 │       if (!pageInfo) {
 489 │         console.error('PageInfo não encontrado para:', permission.page);
 490 │         return;
 491 │       }
 492 │       
 493 │       // Buscar todas as permissões originais que pertencem à mesma aba
 494 │       const { data: allPermissions } = await supabase
 495 │         .from('role_page_permissions')
 496 │         .select('*')
 497 │         .eq('role', role)
 498 │         .eq('company_id', companyId);
 499 │       
 500 │       if (!allPermissions) {
 501 │         console.error('Nenhuma permissão encontrada');
 502 │         return;
 503 │       }
 504 │       
 505 │       // Filtrar permissões que pertencem à mesma aba
 506 │       const relatedPermissions = allPermissions.filter(p => {
 507 │         const pInfo = getPageInfo(p.page);
 508 │         return pInfo && pInfo.module === pageInfo.module && pInfo.tab === pageInfo.tab;
 509 │       });
 510 │       
 511 │       console.log('Permissões relacionadas encontradas:', relatedPermissions);
 512 │       
 513 │       // Atualizar todas as permissões relacionadas
 514 │       for (const perm of relatedPermissions) {
 515 │         await togglePermissionMutation.mutateAsync({
 516 │           page: perm.page,
 517 │           role,
 518 │           allowed: newAllowed
 519 │         });
 520 │       }
 521 │       
 522 │       console.log('Todas as permissões relacionadas atualizadas');
 523 │     } catch (error) {
 524 │       console.error('Erro na mutation:', error);
 525 │     }
 526 │   };
 527 │ 
 528 │   // Função para mapear páginas para módulos e abas
 529 │   const getPageInfo = (page: string) => {
 530 │     const pageMappings: { [key: string]: { module: string; tab: string; pageName: string; description: string } } = {
 531 │       // Módulo de Configurações - Gestão
 532 │       'settings_profile_info': { 
 533 │         module: 'Configurações', 
 534 │         tab: 'Meu Perfil', 
 535 │         pageName: 'Gestão',
 536 │         description: 'Pode ver e editar as informações do próprio perfil'
 537 │       },
 538 │       'settings_profile_integrations': { 
 539 │         module: 'Configurações', 
 540 │         tab: 'Meu Perfil', 
 541 │         pageName: 'Gestão',
 542 │         description: 'Pode ver e editar as informações do próprio perfil'
 543 │       },
 544 │       'settings_profile_security': { 
 545 │         module: 'Configurações', 
 546 │         tab: 'Meu Perfil', 
 547 │         pageName: 'Gestão',
 548 │         description: 'Pode ver e editar as informações do próprio perfil'
 549 │       },
 550 │       'settings_company_data': { 
 551 │         module: 'Configurações', 
 552 │         tab: 'Empresa', 
 553 │         pageName: 'Gestão',
 554 │         description: 'Pode ver e editar informações da própria empresa'
 555 │       },
 556 │       'settings_company_branding': { 
 557 │         module: 'Configurações', 
 558 │         tab: 'Empresa', 
 559 │         pageName: 'Gestão',
 560 │         description: 'Pode ver e editar informações da própria empresa'
 561 │       },
 562 │       'settings_users_list': { 
 563 │         module: 'Configurações', 
 564 │         tab: 'Usuários', 
 565 │         pageName: 'Gestão',
 566 │         description: 'Pode ver todos usuários, criar usuários, editá-los e desativar usuários. Usuário NÃO pode se desativar'
 567 │       },
 568 │       
 569 │       // Configurações CRM
 570 │       'crm_config_funnels': { 
 571 │         module: 'Configurações', 
 572 │         tab: 'Funis', 
 573 │         pageName: 'Configurações CRM',
 574 │         description: 'Pode criar, editar e arquivar Funis'
 575 │       },
 576 │       'crm_config_sources': { 
 577 │         module: 'Configurações', 
 578 │         tab: 'Origens', 
 579 │         pageName: 'Configurações CRM',
 580 │         description: 'Pode criar, editar e arquivar origens'
 581 │       },
 582 │       'crm_config_teams': { 
 583 │         module: 'Configurações', 
 584 │         tab: 'Times', 
 585 │         pageName: 'Configurações CRM',
 586 │         description: 'Pode criar, editar e arquivar Times'
 587 │       },
 588 │       'crm_config_users': { 
 589 │         module: 'Configurações', 
 590 │         tab: 'Usuários', 
 591 │         pageName: 'Configurações CRM',
 592 │         description: 'Gerenciar usuários do CRM'
 593 │       },
 594 │       
 595 │       // Configurações de Agendamento
 596 │       'settings_agendamento_availability': { 
 597 │         module: 'Configurações', 
 598 │         tab: 'Disponibilidade', 
 599 │         pageName: 'Configurações',
 600 │         description: 'Gerenciar disponibilidade para agendamentos'
 601 │       },
 602 │       'settings_agendamento_event_types': { 
 603 │         module: 'Configurações', 
 604 │         tab: 'Tipos de Evento', 
 605 │         pageName: 'Configurações',
 606 │         description: 'Gerenciar tipos de eventos'
 607 │       },
 608 │       'settings_agendamento_forms': { 
 609 │         module: 'Configurações', 
 610 │         tab: 'Formulários', 
 611 │         pageName: 'Configurações',
 612 │         description: 'Gerenciar formulários de agendamento'
 613 │       },
 614 │       'settings_agendamento_calendar': { 
 615 │         module: 'Configurações', 
 616 │         tab: 'Calendário', 
 617 │         pageName: 'Configurações',
 618 │         description: 'Configurar calendário de agendamentos'
 619 │       },
 620 │ 
 621 │       // Módulo do Simulador
 622 │       'simulator': { 
 623 │         module: 'Simulador', 
 624 │         tab: 'Simulador', 
 625 │         pageName: 'Simulador',
 626 │         description: 'Pode usar o simulador'
 627 │       },
 628 │       
 629 │       // Configurações do Simulador
 630 │       'simulator_config_administrators': { 
 631 │         module: 'Simulador', 
 632 │         tab: 'Administradoras', 
 633 │         pageName: 'Configurações do Simulador',
 634 │         description: 'Pode criar, editar e arquivar administradoras'
 635 │       },
 636 │       'simulator_config_reductions': { 
 637 │         module: 'Simulador', 
 638 │         tab: 'Redução de Parcela', 
 639 │         pageName: 'Configurações do Simulador',
 640 │         description: 'Pode criar, editar e arquivar Redução de Parcela'
 641 │       },
 642 │       'simulator_config_installments': { 
 643 │         module: 'Simulador', 
 644 │         tab: 'Parcelas', 
 645 │         pageName: 'Configurações do Simulador',
 646 │         description: 'Pode criar, editar e arquivar Parcelas'
 647 │       },
 648 │       'simulator_config_products': { 
 649 │         module: 'Simulador', 
 650 │         tab: 'Produtos', 
 651 │         pageName: 'Configurações do Simulador',
 652 │         description: 'Pode criar, editar e arquivar Produtos'
 653 │       },
 654 │       'simulator_config_leverages': { 
 655 │         module: 'Simulador', 
 656 │         tab: 'Alavancas', 
 657 │         pageName: 'Configurações do Simulador',
 658 │         description: 'Pode criar, editar e arquivar Alavancas'
 659 │       },
 660 │ 
 661 │       // Módulo CRM
 662 │       'indicadores': { 
 663 │         module: 'CRM', 
 664 │         tab: 'Performance', 
 665 │         pageName: 'Indicadores',
 666 │         description: 'Pode ver todos os indicadores, de todos os funis, de todas as equipes e de todos os usuários'
 667 │       },
 668 │       'indicadores_performance': { 
 669 │         module: 'CRM', 
 670 │         tab: 'Performance', 
 671 │         pageName: 'Indicadores',
 672 │         description: 'Pode ver todos os indicadores, de todos os funis, de todas as equipes e de todos os usuários'
 673 │       },
 674 │       'indicadores_registro': { 
 675 │         module: 'CRM', 
 676 │         tab: 'Registro de Indicadores', 
 677 │         pageName: 'Indicadores',
 678 │         description: 'Pode registrar indicadores somente para si, editar somente os próprios indicadores e pode ver os indicadores de todos os funis, de todos os times e de todos os usuários'
 679 │       },
 680 │       'reports': { 
 681 │         module: 'CRM', 
 682 │         tab: 'Registro de Indicadores', 
 683 │         pageName: 'Indicadores',
 684 │         description: 'Pode registrar indicadores somente para si, editar somente os próprios indicadores e pode ver os indicadores de todos os funis, de todos os times e de todos os usuários'
 685 │       },
 686 │       
 687 │       // Comercial
 688 │       'comercial': { 
 689 │         module: 'CRM', 
 690 │         tab: 'Leads', 
 691 │         pageName: 'Comercial',
 692 │         description: 'Pode ver todos os leads, criar leads para qualquer usuário, editar os leads de qualquer usuário e excluir leads de qualquer usuário'
 693 │       },
 694 │       'comercial_leads': { 
 695 │         module: 'CRM', 
 696 │         tab: 'Leads', 
 697 │         pageName: 'Comercial',
 698 │         description: 'Pode ver todos os leads, criar leads para qualquer usuário, editar os leads de qualquer usuário e excluir leads de qualquer usuário'
 699 │       },
 700 │       'comercial_sales': { 
 701 │         module: 'CRM', 
 702 │         tab: 'Vendas', 
 703 │         pageName: 'Comercial',
 704 │         description: 'Pode ver ver todos as vendas, registrar vendas para qualquer usuário, editar as vendas de qualquer usuário e excluir vendas de qualquer usuário'
 705 │       },
 706 │       
 707 │       // Outras páginas CRM
 708 │       'dashboard': { 
 709 │         module: 'CRM', 
 710 │         tab: 'Dashboard', 
 711 │         pageName: 'Dashboard',
 712 │         description: 'Acesso ao dashboard do CRM'
 713 │       },
 714 │       'agenda': { 
 715 │         module: 'CRM', 
 716 │         tab: 'Agenda', 
 717 │         pageName: 'Agenda',
 718 │         description: 'Gerenciar agenda'
 719 │       },
 720 │       'agenda_temp': { 
 721 │         module: 'CRM', 
 722 │         tab: 'Agenda', 
 723 │         pageName: 'Agenda',
 724 │         description: 'Gerenciar agenda'
 725 │       },
 726 │ 
 727 │       // CRM Master (removido - não deve aparecer nas permissões)
 728 │       'crm_master_accesses': { module: 'CRM Master', tab: 'Acessos', pageName: 'CRM Master', description: '' },
 729 │       'crm_master_archived': { module: 'CRM Master', tab: 'Arquivados', pageName: 'CRM Master', description: '' },
 730 │       'crm_master_companies': { module: 'CRM Master', tab: 'Empresas', pageName: 'CRM Master', description: '' }
 731 │     };
 732 │ 
 733 │     return pageMappings[page] || null; // Retorna null para páginas que não devem aparecer na tabela
 734 │   };
 735 │ 
 736 │   // Funções para obter opções dos filtros
 737 │   const getModuleOptions = () => {
 738 │     const modules = [...new Set(permissions.map(p => p.module))];
 739 │     return modules.map(module => ({
 740 │       label: module,
 741 │       value: module
 742 │     }));
 743 │   };
 744 │ 
 745 │   const getPageOptions = () => {
 746 │     // Mostrar todas as páginas disponíveis, independente dos módulos selecionados
 747 │     const pages = [...new Set(permissions.map(p => p.pageName))];
 748 │     return pages.map(page => ({
 749 │       label: page,
 750 │       value: page
 751 │     }));
 752 │   };
 753 │ 
 754 │   const getTabOptions = () => {
 755 │     // Mostrar todas as abas disponíveis, independente dos módulos e páginas selecionados
 756 │     const tabs = [...new Set(permissions.map(p => p.tab))];
 757 │     return tabs.map(tab => ({
 758 │       label: tab,
 759 │       value: tab
 760 │     }));
 761 │   };
 762 │ 
 763 │   // Filtros
 764 │   const filteredCompanies = companies.filter(company =>
 765 │     company.name?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
 766 │     company.cnpj?.includes(companySearchTerm) ||
 767 │     company.niche?.toLowerCase().includes(companySearchTerm.toLowerCase())
 768 │   );
 769 │ 
 770 │   const filteredPermissions = permissions.filter(permission => {
 771 │     // Filtro por módulo - se nenhum módulo estiver selecionado, mostrar todos
 772 │     if (selectedModules.length > 0 && !selectedModules.includes(permission.module)) {
 773 │       return false;
 774 │     }
 775 │     
 776 │     // Filtro por página - se nenhuma página estiver selecionada, mostrar todas
 777 │     if (selectedPages.length > 0 && !selectedPages.includes(permission.pageName)) {
 778 │       return false;
 779 │     }
 780 │     
 781 │     // Filtro por aba - se nenhuma aba estiver selecionada, mostrar todas
 782 │     if (selectedTabs.length > 0 && !selectedTabs.includes(permission.tab)) {
 783 │       return false;
 784 │     }
 785 │     
 786 │     // Filtro por situação
 787 │     if (selectedStatus !== 'all') {
 788 │       const isActive = isPageActive(permission.page);
 789 │       if (selectedStatus === 'active' && !isActive) {
 790 │         return false;
 791 │       }
 792 │       if (selectedStatus === 'inactive' && isActive) {
 793 │         return false;
 794 │       }
 795 │     }
 796 │     
 797 │     // Filtro por texto (busca)
 798 │     if (permissionSearchTerm) {
 799 │       const searchTerm = permissionSearchTerm.toLowerCase();
 800 │       return (
 801 │         permission.page?.toLowerCase().includes(searchTerm) ||
 802 │         permission.pageName?.toLowerCase().includes(searchTerm) ||
 803 │         permission.tab?.toLowerCase().includes(searchTerm) ||
 804 │         permission.module?.toLowerCase().includes(searchTerm)
 805 │       );
 806 │     }
 807 │     
 808 │     return true;
 809 │   });
 810 │ 
 811 │   // Verificar permissões
 812 │   const canManageCompanies = userRole === 'master';
 813 │   const canManagePermissions = userRole === 'master';
 814 │ 
 815 │   const allowedOrder: { key: string; allowed: boolean }[] = [
 816 │     { key: 'companies', allowed: canManageCompanies },
 817 │     { key: 'permissions', allowed: canManagePermissions },
 818 │   ];
 819 │   const firstAllowed = allowedOrder.find(i => i.allowed)?.key;
 820 │   const [tabValue, setTabValue] = useState<string>(firstAllowed || 'companies');
 821 │   
 822 │   useEffect(() => {
 823 │     const next = allowedOrder.find(i => i.allowed)?.key || 'companies';
 824 │     if (!allowedOrder.find(i => i.key === tabValue && i.allowed)) {
 825 │       setTabValue(next);
 826 │     }
 827 │   }, [canManageCompanies, canManagePermissions, tabValue]);
 828 │ 
 829 │   // Verificar acesso
 830 │   if (userRole !== 'master') {
 831 │     return (
 832 │         <div className="min-h-[400px] flex items-center justify-center">
 833 │           <div className="text-center">
 834 │             <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
 835 │           <p className="text-muted-foreground">Apenas usuários Master podem acessar esta página.</p>
 836 │         </div>
 837 │       </div>
 838 │     );
 839 │   }
 840 │ 
 841 │   // Funções para limpar filtros dependentes
 842 │   const handleModuleChange = (modules: string[]) => {
 843 │     setSelectedModules(modules);
 844 │     // Não limpar filtros dependentes - filtros funcionam independentemente
 845 │   };
 846 │ 
 847 │   const handlePageChange = (pages: string[]) => {
 848 │     setSelectedPages(pages);
 849 │     // Não limpar filtros dependentes - filtros funcionam independentemente
 850 │   };
 851 │ 
 852 │   const handleTabChange = (tabs: string[]) => {
 853 │     setSelectedTabs(tabs);
 854 │   };
 855 │ 
 856 │   const clearAllFilters = () => {
 857 │     setSelectedModules([]);
 858 │     setSelectedPages([]);
 859 │     setSelectedTabs([]);
 860 │     setSelectedStatus('active'); // Voltar para o padrão
 861 │     setPermissionSearchTerm('');
 862 │   };
 863 │ 
 864 │   // Função para alternar status da página
 865 │   const handleTogglePageStatus = (page: string) => {
 866 │     const currentStatus = isPageActive(page);
 867 │     const newStatus = currentStatus ? 'inactive' : 'active';
 868 │     
 869 │     togglePageStatusMutation.mutateAsync({ page, status: newStatus });
 870 │   };
 871 │ 
 872 │   const handleStartEditDescription = (permission: any) => {
 873 │     setEditingDescription(permission.id);
 874 │     setEditingDescriptionValue(permission.description || '');
 875 │   };
 876 │ 
 877 │   const handleSaveDescription = async (permission: any) => {
 878 │     if (editingDescriptionValue.trim() === '') {
 879 │       toast.error('Descrição não pode estar vazia');
 880 │       return;
 881 │     }
 882 │     
 883 │     await updateDescriptionMutation.mutateAsync({
 884 │       page: permission.page,
 885 │       description: editingDescriptionValue.trim()
 886 │     });
 887 │   };
 888 │ 
 889 │   const handleCancelEditDescription = () => {
 890 │     setEditingDescription(null);
 891 │     setEditingDescriptionValue('');
 892 │   };
 893 │ 
 894 │   const handleEditPermission = (permission: any) => {
 895 │     setSelectedPermission(permission);
 896 │     setPermissionName(permission.name);
 897 │     setPermissionLevel(permission.level);
 898 │     setPermissionDetails(permission.details || []);
 899 │     setShowPermissionModal(true);
 900 │   };
 901 │ 
 902 │   const handleTogglePermissionStatus = async (permission: any) => {
     ·         ──────────────┬─────────────
     ·                       ╰── `handleTogglePermissionStatus` redefined here
 903 │     const newStatus = permission.status === 'active' ? 'inactive' : 'active';
 904 │     
 905 │     // Por enquanto, apenas simular a atualização
     ╰────
  × the name `resetPermissionForm` is defined multiple times
     ╭─[/Users/eduardocosta/Downloads/Projeto Monteo/src/pages/settings/SettingsMaster.tsx:436:1]
 433 │     toast.success(`Permissão ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso!`);
 434 │   };
 435 │ 
 436 │   const resetPermissionForm = () => {
     ·         ─────────┬─────────
     ·                  ╰── previous definition of `resetPermissionForm` here
 437 │     setPermissionName('');
 438 │     setPermissionLevel('');
 439 │     setPermissionDetails([]);
 440 │     setSelectedPermission(null);
 441 │   };
 442 │ 
 443 │   const handleCreatePermission = async (e: React.FormEvent) => {
 444 │     e.preventDefault();
 445 │     
 446 │     if (!permissionName || !permissionLevel) {
 447 │       toast.error('Por favor, preencha todos os campos obrigatórios');
 448 │       return;
 449 │     }
 450 │ 
 451 │     setIsCreatingPermission(true);
 452 │     
 453 │     try {
 454 │       // Por enquanto, apenas simular a criação
 455 │       console.log('Criando/Editando permissão:', {
 456 │         name: permissionName,
 457 │         level: permissionLevel,
 458 │         details: permissionDetails
 459 │       });
 460 │       
 461 │       // Em uma implementação futura, isso seria uma mutation
 462 │       await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
 463 │       
 464 │       toast.success(selectedPermission ? 'Permissão atualizada com sucesso!' : 'Permissão criada com sucesso!');
 465 │       setShowPermissionModal(false);
 466 │       resetPermissionForm();
 467 │       
 468 │       // Invalidar queries para atualizar a lista
 469 │       queryClient.invalidateQueries({ queryKey: ['permissions', 'master'] });
 470 │     } catch (error) {
 471 │       console.error('Erro ao criar/editar permissão:', error);
 472 │       toast.error('Erro ao salvar permissão');
 473 │     } finally {
 474 │       setIsCreatingPermission(false);
 475 │     }
 476 │   };
 477 │ 
 478 │   const handleTogglePermission = async (permission: any, role: string) => {
 479 │     console.log('handleTogglePermission chamado:', { permission, role });
 480 │     const currentAllowed = permission[`${role}_allowed`];
 481 │     const newAllowed = !currentAllowed;
 482 │     
 483 │     console.log('Valores:', { currentAllowed, newAllowed, page: permission.page });
 484 │     
 485 │     try {
 486 │       // Buscar todas as páginas que pertencem à mesma aba
 487 │       const pageInfo = getPageInfo(permission.page);
 488 │       if (!pageInfo) {
 489 │         console.error('PageInfo não encontrado para:', permission.page);
 490 │         return;
 491 │       }
 492 │       
 493 │       // Buscar todas as permissões originais que pertencem à mesma aba
 494 │       const { data: allPermissions } = await supabase
 495 │         .from('role_page_permissions')
 496 │         .select('*')
 497 │         .eq('role', role)
 498 │         .eq('company_id', companyId);
 499 │       
 500 │       if (!allPermissions) {
 501 │         console.error('Nenhuma permissão encontrada');
 502 │         return;
 503 │       }
 504 │       
 505 │       // Filtrar permissões que pertencem à mesma aba
 506 │       const relatedPermissions = allPermissions.filter(p => {
 507 │         const pInfo = getPageInfo(p.page);
 508 │         return pInfo && pInfo.module === pageInfo.module && pInfo.tab === pageInfo.tab;
 509 │       });
 510 │       
 511 │       console.log('Permissões relacionadas encontradas:', relatedPermissions);
 512 │       
 513 │       // Atualizar todas as permissões relacionadas
 514 │       for (const perm of relatedPermissions) {
 515 │         await togglePermissionMutation.mutateAsync({
 516 │           page: perm.page,
 517 │           role,
 518 │           allowed: newAllowed
 519 │         });
 520 │       }
 521 │       
 522 │       console.log('Todas as permissões relacionadas atualizadas');
 523 │     } catch (error) {
 524 │       console.error('Erro na mutation:', error);
 525 │     }
 526 │   };
 527 │ 
 528 │   // Função para mapear páginas para módulos e abas
 529 │   const getPageInfo = (page: string) => {
 530 │     const pageMappings: { [key: string]: { module: string; tab: string; pageName: string; description: string } } = {
 531 │       // Módulo de Configurações - Gestão
 532 │       'settings_profile_info': { 
 533 │         module: 'Configurações', 
 534 │         tab: 'Meu Perfil', 
 535 │         pageName: 'Gestão',
 536 │         description: 'Pode ver e editar as informações do próprio perfil'
 537 │       },
 538 │       'settings_profile_integrations': { 
 539 │         module: 'Configurações', 
 540 │         tab: 'Meu Perfil', 
 541 │         pageName: 'Gestão',
 542 │         description: 'Pode ver e editar as informações do próprio perfil'
 543 │       },
 544 │       'settings_profile_security': { 
 545 │         module: 'Configurações', 
 546 │         tab: 'Meu Perfil', 
 547 │         pageName: 'Gestão',
 548 │         description: 'Pode ver e editar as informações do próprio perfil'
 549 │       },
 550 │       'settings_company_data': { 
 551 │         module: 'Configurações', 
 552 │         tab: 'Empresa', 
 553 │         pageName: 'Gestão',
 554 │         description: 'Pode ver e editar informações da própria empresa'
 555 │       },
 556 │       'settings_company_branding': { 
 557 │         module: 'Configurações', 
 558 │         tab: 'Empresa', 
 559 │         pageName: 'Gestão',
 560 │         description: 'Pode ver e editar informações da própria empresa'
 561 │       },
 562 │       'settings_users_list': { 
 563 │         module: 'Configurações', 
 564 │         tab: 'Usuários', 
 565 │         pageName: 'Gestão',
 566 │         description: 'Pode ver todos usuários, criar usuários, editá-los e desativar usuários. Usuário NÃO pode se desativar'
 567 │       },
 568 │       
 569 │       // Configurações CRM
 570 │       'crm_config_funnels': { 
 571 │         module: 'Configurações', 
 572 │         tab: 'Funis', 
 573 │         pageName: 'Configurações CRM',
 574 │         description: 'Pode criar, editar e arquivar Funis'
 575 │       },
 576 │       'crm_config_sources': { 
 577 │         module: 'Configurações', 
 578 │         tab: 'Origens', 
 579 │         pageName: 'Configurações CRM',
 580 │         description: 'Pode criar, editar e arquivar origens'
 581 │       },
 582 │       'crm_config_teams': { 
 583 │         module: 'Configurações', 
 584 │         tab: 'Times', 
 585 │         pageName: 'Configurações CRM',
 586 │         description: 'Pode criar, editar e arquivar Times'
 587 │       },
 588 │       'crm_config_users': { 
 589 │         module: 'Configurações', 
 590 │         tab: 'Usuários', 
 591 │         pageName: 'Configurações CRM',
 592 │         description: 'Gerenciar usuários do CRM'
 593 │       },
 594 │       
 595 │       // Configurações de Agendamento
 596 │       'settings_agendamento_availability': { 
 597 │         module: 'Configurações', 
 598 │         tab: 'Disponibilidade', 
 599 │         pageName: 'Configurações',
 600 │         description: 'Gerenciar disponibilidade para agendamentos'
 601 │       },
 602 │       'settings_agendamento_event_types': { 
 603 │         module: 'Configurações', 
 604 │         tab: 'Tipos de Evento', 
 605 │         pageName: 'Configurações',
 606 │         description: 'Gerenciar tipos de eventos'
 607 │       },
 608 │       'settings_agendamento_forms': { 
 609 │         module: 'Configurações', 
 610 │         tab: 'Formulários', 
 611 │         pageName: 'Configurações',
 612 │         description: 'Gerenciar formulários de agendamento'
 613 │       },
 614 │       'settings_agendamento_calendar': { 
 615 │         module: 'Configurações', 
 616 │         tab: 'Calendário', 
 617 │         pageName: 'Configurações',
 618 │         description: 'Configurar calendário de agendamentos'
 619 │       },
 620 │ 
 621 │       // Módulo do Simulador
 622 │       'simulator': { 
 623 │         module: 'Simulador', 
 624 │         tab: 'Simulador', 
 625 │         pageName: 'Simulador',
 626 │         description: 'Pode usar o simulador'
 627 │       },
 628 │       
 629 │       // Configurações do Simulador
 630 │       'simulator_config_administrators': { 
 631 │         module: 'Simulador', 
 632 │         tab: 'Administradoras', 
 633 │         pageName: 'Configurações do Simulador',
 634 │         description: 'Pode criar, editar e arquivar administradoras'
 635 │       },
 636 │       'simulator_config_reductions': { 
 637 │         module: 'Simulador', 
 638 │         tab: 'Redução de Parcela', 
 639 │         pageName: 'Configurações do Simulador',
 640 │         description: 'Pode criar, editar e arquivar Redução de Parcela'
 641 │       },
 642 │       'simulator_config_installments': { 
 643 │         module: 'Simulador', 
 644 │         tab: 'Parcelas', 
 645 │         pageName: 'Configurações do Simulador',
 646 │         description: 'Pode criar, editar e arquivar Parcelas'
 647 │       },
 648 │       'simulator_config_products': { 
 649 │         module: 'Simulador', 
 650 │         tab: 'Produtos', 
 651 │         pageName: 'Configurações do Simulador',
 652 │         description: 'Pode criar, editar e arquivar Produtos'
 653 │       },
 654 │       'simulator_config_leverages': { 
 655 │         module: 'Simulador', 
 656 │         tab: 'Alavancas', 
 657 │         pageName: 'Configurações do Simulador',
 658 │         description: 'Pode criar, editar e arquivar Alavancas'
 659 │       },
 660 │ 
 661 │       // Módulo CRM
 662 │       'indicadores': { 
 663 │         module: 'CRM', 
 664 │         tab: 'Performance', 
 665 │         pageName: 'Indicadores',
 666 │         description: 'Pode ver todos os indicadores, de todos os funis, de todas as equipes e de todos os usuários'
 667 │       },
 668 │       'indicadores_performance': { 
 669 │         module: 'CRM', 
 670 │         tab: 'Performance', 
 671 │         pageName: 'Indicadores',
 672 │         description: 'Pode ver todos os indicadores, de todos os funis, de todas as equipes e de todos os usuários'
 673 │       },
 674 │       'indicadores_registro': { 
 675 │         module: 'CRM', 
 676 │         tab: 'Registro de Indicadores', 
 677 │         pageName: 'Indicadores',
 678 │         description: 'Pode registrar indicadores somente para si, editar somente os próprios indicadores e pode ver os indicadores de todos os funis, de todos os times e de todos os usuários'
 679 │       },
 680 │       'reports': { 
 681 │         module: 'CRM', 
 682 │         tab: 'Registro de Indicadores', 
 683 │         pageName: 'Indicadores',
 684 │         description: 'Pode registrar indicadores somente para si, editar somente os próprios indicadores e pode ver os indicadores de todos os funis, de todos os times e de todos os usuários'
 685 │       },
 686 │       
 687 │       // Comercial
 688 │       'comercial': { 
 689 │         module: 'CRM', 
 690 │         tab: 'Leads', 
 691 │         pageName: 'Comercial',
 692 │         description: 'Pode ver todos os leads, criar leads para qualquer usuário, editar os leads de qualquer usuário e excluir leads de qualquer usuário'
 693 │       },
 694 │       'comercial_leads': { 
 695 │         module: 'CRM', 
 696 │         tab: 'Leads', 
 697 │         pageName: 'Comercial',
 698 │         description: 'Pode ver todos os leads, criar leads para qualquer usuário, editar os leads de qualquer usuário e excluir leads de qualquer usuário'
 699 │       },
 700 │       'comercial_sales': { 
 701 │         module: 'CRM', 
 702 │         tab: 'Vendas', 
 703 │         pageName: 'Comercial',
 704 │         description: 'Pode ver ver todos as vendas, registrar vendas para qualquer usuário, editar as vendas de qualquer usuário e excluir vendas de qualquer usuário'
 705 │       },
 706 │       
 707 │       // Outras páginas CRM
 708 │       'dashboard': { 
 709 │         module: 'CRM', 
 710 │         tab: 'Dashboard', 
 711 │         pageName: 'Dashboard',
 712 │         description: 'Acesso ao dashboard do CRM'
 713 │       },
 714 │       'agenda': { 
 715 │         module: 'CRM', 
 716 │         tab: 'Agenda', 
 717 │         pageName: 'Agenda',
 718 │         description: 'Gerenciar agenda'
 719 │       },
 720 │       'agenda_temp': { 
 721 │         module: 'CRM', 
 722 │         tab: 'Agenda', 
 723 │         pageName: 'Agenda',
 724 │         description: 'Gerenciar agenda'
 725 │       },
 726 │ 
 727 │       // CRM Master (removido - não deve aparecer nas permissões)
 728 │       'crm_master_accesses': { module: 'CRM Master', tab: 'Acessos', pageName: 'CRM Master', description: '' },
 729 │       'crm_master_archived': { module: 'CRM Master', tab: 'Arquivados', pageName: 'CRM Master', description: '' },
 730 │       'crm_master_companies': { module: 'CRM Master', tab: 'Empresas', pageName: 'CRM Master', description: '' }
 731 │     };
 732 │ 
 733 │     return pageMappings[page] || null; // Retorna null para páginas que não devem aparecer na tabela
 734 │   };
 735 │ 
 736 │   // Funções para obter opções dos filtros
 737 │   const getModuleOptions = () => {
 738 │     const modules = [...new Set(permissions.map(p => p.module))];
 739 │     return modules.map(module => ({
 740 │       label: module,
 741 │       value: module
 742 │     }));
 743 │   };
 744 │ 
 745 │   const getPageOptions = () => {
 746 │     // Mostrar todas as páginas disponíveis, independente dos módulos selecionados
 747 │     const pages = [...new Set(permissions.map(p => p.pageName))];
 748 │     return pages.map(page => ({
 749 │       label: page,
 750 │       value: page
 751 │     }));
 752 │   };
 753 │ 
 754 │   const getTabOptions = () => {
 755 │     // Mostrar todas as abas disponíveis, independente dos módulos e páginas selecionados
 756 │     const tabs = [...new Set(permissions.map(p => p.tab))];
 757 │     return tabs.map(tab => ({
 758 │       label: tab,
 759 │       value: tab
 760 │     }));
 761 │   };
 762 │ 
 763 │   // Filtros
 764 │   const filteredCompanies = companies.filter(company =>
 765 │     company.name?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
 766 │     company.cnpj?.includes(companySearchTerm) ||
 767 │     company.niche?.toLowerCase().includes(companySearchTerm.toLowerCase())
 768 │   );
 769 │ 
 770 │   const filteredPermissions = permissions.filter(permission => {
 771 │     // Filtro por módulo - se nenhum módulo estiver selecionado, mostrar todos
 772 │     if (selectedModules.length > 0 && !selectedModules.includes(permission.module)) {
 773 │       return false;
 774 │     }
 775 │     
 776 │     // Filtro por página - se nenhuma página estiver selecionada, mostrar todas
 777 │     if (selectedPages.length > 0 && !selectedPages.includes(permission.pageName)) {
 778 │       return false;
 779 │     }
 780 │     
 781 │     // Filtro por aba - se nenhuma aba estiver selecionada, mostrar todas
 782 │     if (selectedTabs.length > 0 && !selectedTabs.includes(permission.tab)) {
 783 │       return false;
 784 │     }
 785 │     
 786 │     // Filtro por situação
 787 │     if (selectedStatus !== 'all') {
 788 │       const isActive = isPageActive(permission.page);
 789 │       if (selectedStatus === 'active' && !isActive) {
 790 │         return false;
 791 │       }
 792 │       if (selectedStatus === 'inactive' && isActive) {
 793 │         return false;
 794 │       }
 795 │     }
 796 │     
 797 │     // Filtro por texto (busca)
 798 │     if (permissionSearchTerm) {
 799 │       const searchTerm = permissionSearchTerm.toLowerCase();
 800 │       return (
 801 │         permission.page?.toLowerCase().includes(searchTerm) ||
 802 │         permission.pageName?.toLowerCase().includes(searchTerm) ||
 803 │         permission.tab?.toLowerCase().includes(searchTerm) ||
 804 │         permission.module?.toLowerCase().includes(searchTerm)
 805 │       );
 806 │     }
 807 │     
 808 │     return true;
 809 │   });
 810 │ 
 811 │   // Verificar permissões
 812 │   const canManageCompanies = userRole === 'master';
 813 │   const canManagePermissions = userRole === 'master';
 814 │ 
 815 │   const allowedOrder: { key: string; allowed: boolean }[] = [
 816 │     { key: 'companies', allowed: canManageCompanies },
 817 │     { key: 'permissions', allowed: canManagePermissions },
 818 │   ];
 819 │   const firstAllowed = allowedOrder.find(i => i.allowed)?.key;
 820 │   const [tabValue, setTabValue] = useState<string>(firstAllowed || 'companies');
 821 │   
 822 │   useEffect(() => {
 823 │     const next = allowedOrder.find(i => i.allowed)?.key || 'companies';
 824 │     if (!allowedOrder.find(i => i.key === tabValue && i.allowed)) {
 825 │       setTabValue(next);
 826 │     }
 827 │   }, [canManageCompanies, canManagePermissions, tabValue]);
 828 │ 
 829 │   // Verificar acesso
 830 │   if (userRole !== 'master') {
 831 │     return (
 832 │         <div className="min-h-[400px] flex items-center justify-center">
 833 │           <div className="text-center">
 834 │             <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
 835 │           <p className="text-muted-foreground">Apenas usuários Master podem acessar esta página.</p>
 836 │         </div>
 837 │       </div>
 838 │     );
 839 │   }
 840 │ 
 841 │   // Funções para limpar filtros dependentes
 842 │   const handleModuleChange = (modules: string[]) => {
 843 │     setSelectedModules(modules);
 844 │     // Não limpar filtros dependentes - filtros funcionam independentemente
 845 │   };
 846 │ 
 847 │   const handlePageChange = (pages: string[]) => {
 848 │     setSelectedPages(pages);
 849 │     // Não limpar filtros dependentes - filtros funcionam independentemente
 850 │   };
 851 │ 
 852 │   const handleTabChange = (tabs: string[]) => {
 853 │     setSelectedTabs(tabs);
 854 │   };
 855 │ 
 856 │   const clearAllFilters = () => {
 857 │     setSelectedModules([]);
 858 │     setSelectedPages([]);
 859 │     setSelectedTabs([]);
 860 │     setSelectedStatus('active'); // Voltar para o padrão
 861 │     setPermissionSearchTerm('');
 862 │   };
 863 │ 
 864 │   // Função para alternar status da página
 865 │   const handleTogglePageStatus = (page: string) => {
 866 │     const currentStatus = isPageActive(page);
 867 │     const newStatus = currentStatus ? 'inactive' : 'active';
 868 │     
 869 │     togglePageStatusMutation.mutateAsync({ page, status: newStatus });
 870 │   };
 871 │ 
 872 │   const handleStartEditDescription = (permission: any) => {
 873 │     setEditingDescription(permission.id);
 874 │     setEditingDescriptionValue(permission.description || '');
 875 │   };
 876 │ 
 877 │   const handleSaveDescription = async (permission: any) => {
 878 │     if (editingDescriptionValue.trim() === '') {
 879 │       toast.error('Descrição não pode estar vazia');
 880 │       return;
 881 │     }
 882 │     
 883 │     await updateDescriptionMutation.mutateAsync({
 884 │       page: permission.page,
 885 │       description: editingDescriptionValue.trim()
 886 │     });
 887 │   };
 888 │ 
 889 │   const handleCancelEditDescription = () => {
 890 │     setEditingDescription(null);
 891 │     setEditingDescriptionValue('');
 892 │   };
 893 │ 
 894 │   const handleEditPermission = (permission: any) => {
 895 │     setSelectedPermission(permission);
 896 │     setPermissionName(permission.name);
 897 │     setPermissionLevel(permission.level);
 898 │     setPermissionDetails(permission.details || []);
 899 │     setShowPermissionModal(true);
 900 │   };
 901 │ 
 902 │   const handleTogglePermissionStatus = async (permission: any) => {
 903 │     const newStatus = permission.status === 'active' ? 'inactive' : 'active';
 904 │     
 905 │     // Por enquanto, apenas simular a atualização
 906 │     console.log('Alterando status da permissão:', { permission, newStatus });
 907 │     
 908 │     // Em uma implementação futura, isso seria uma mutation
 909 │     toast.success(`Permissão ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso!`);
 910 │   };
 911 │ 
 912 │   const resetPermissionForm = () => {
     ·         ─────────┬─────────
     ·                  ╰── `resetPermissionForm` redefined here
 913 │     setPermissionName('');
 914 │     setPermissionLevel('');
 915 │     setPermissionDetails([]);
     ╰────
/Users/eduardocosta/Downloads/Projeto Monteo/src/pages/settings/SettingsMaster.tsx:418:1